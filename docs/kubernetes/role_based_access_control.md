# Role Based Access Control

## 1. What RBAC Governs

RBAC controls who can do what against the Kubernetes API, not application-level permissions, but API level ones (can this identity get/list/create/delete this kind of object). Every `kubectl` commands and every in-cluster API call from a pod is checked against RBAC rules.

Two separates axes to keep straight:

- What the permission covers (Role/ClusterRole)
- Who gets it, and where it applies (RoleBinding/ClusterRoleBinding)

## 2. The Four Core Objects

**Role**

- Defines a set of permissions: verbs (`get`, `list`, `watch`, `create`, `delete`, etc.) on resources (`pods`, `configmaps`, `secrets`, etc.)
- Namespace-scoped, only has effect within the namespace it's created in

**ClusterRole**

- Same structure as a role, but not tied to a namespace
- Can grant permissions cluster-wide, OR be reused within a single namespace via a RoleBinding
- required for genuinely non-namespace resources (`nodes`, `persistentvolumes`), since those don't belong to any namespace at all

**RoleBinding**

- Grants a Role or a ClusterRole to a subject (ServiceAccount, user, or group)
- Always scoped to one namespace, even when binding a ClusterRole, the effective grant is still contained to that namespace
- Common reusable pattern: define one generic ClusterRole (e.g. "read-only"), then grant it per-namespace via separate RoleBindings, instead of duplicating near-identical Roles everywhere

**ClusterRoleBinding**

- Grants a ClusterRole across the entire cluster, all namespaces
- No namespace-limited version exists

> Role + ClusterRoleBinding is not a valid combination, a Role is inherently namespace-scoped and cannot be bound cluster-wide

**Bindable thing and Scope**

- Role + RoleBinding - namespace defined permissions, namespace scoped grant (most common, most contained)
- ClusterRole + RoleBinding - cluster-defined permission, but granted only in one namespace (reusable role, contained blast radius)
- ClusterRole + ClusterRoleBinding - cluster-wide permission, cluster-wide grant (broadest, use sparingly)

## 4. ServiceAccounts vs. Human User Identity

Kubernetes has no native "User" object. Two genuinely different identity mechanisms:

**Human users (e.g. running `kubectl`):**

- Identity comes from outside the cluster, client certificate, external OIDC/IAM token.
- Kubernetes trusts whatever credential the kubeconfig context represents and checks RBAC against it
- `kubectl auth can-i --as=<identity>` impersonates another identity for testing, you're still authenticated as yourself, just asking "what if I were this identity instead?"

**ServiceAccounts:**

- For workloads running inside the cluster (pods, controllers, operators, apps)
- Attached to a pod via `spec.serviceAccountName`
- Once attached, Kubernetes auto-mounts a token at `/var/run/secrets/kubernetes.io/serviceaccount` inside the container, three files:

`token` - JWT representing the ServiceAccount's identity, used as a Bearer token for API calls

`ca.crt` - used to verify the API server's certificate

`namespace` - self-reports which namespace the pod is running in

- Any code in the container can use the token to call the Kubernetes API directly, this is how controllers/operators/apps that need cluster introspection authenticate without a human involved.
- Real-world example: Prometheus uses a ServiceAccount (bound to a ClusterRole) to `list`/`watch` pods, services, and endpoints across namespaces for service discovery
- Default behavior worth knowing: every namespace auto-creates a `default` ServiceAccount, and every pod uses it unless `serviceAccountName` is explicitly set, a common accidental over-permissioning risk if left unset carelessly
- `https://kubernetes.default.svc` - special in-cluster DNS name that always resolve to the API server, how pods talk to the API without knowing it's actual IP

## 5. Verification Patter, Three Layers, Not Just One

Creating the RBAC object isn't enough, the real skill is proving the boundary holds, both what's allowed and what's correctly denied.

Layer 1 - Theoretical: read the Role's `rules` and reason through what should/shouldn't be permitted, before testing anything.

Layer 2 - Simulated (`kubectl auth can-i --as=`): No pod required.

Fast way to check permissions for any identity:

```bash
kubectl auth can-i list pods -n cka-drill --as=system:serviceaccount:cka-drill:drill-reader
kubectl auth can-i delete pods -n cka-drill --as=system:serviceaccount:cka-drill:drill-reader
kubectl auth can-i list pods -n kube-system --as=system:serviceaccount:cka-drill:drill-reader
```

Note the ServiceAccount identity format:
`system:serviceaccount:<namespace>:<name>`

Layer 3 - Live (real pod, real token, real API call): Attach the ServiceAccount to an actual pod (`spec.serviceAccountName`), exec in and call the API server directly using the mounted token:

```bash
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

curl -s --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  -H "Authorization: Bearer $TOKEN" \
  https://kubernetes.default.svc/api/v1/namespaces/$NAMESPACE/pods
```

An allowed call returns actual JSON data. A denied call returns HTTP `403 Forbidden` with a `Forbidden` reason in the JSON body.

Doing all three layers on the same rule set is the most convincing way to confirm RBAC is actually enforcing what you think it is, theory can be wrong, simulation can miss context, live calls are ground truth.
