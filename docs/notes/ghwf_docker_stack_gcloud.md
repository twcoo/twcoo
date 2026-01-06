# GitHub Workflow: Deploy Docker Stack to GCP VM

> The example below shows a workflow running on a self-hosted GitHub runner,  
> specifically using the [myoung34/docker-github-actions-runner](https://github.com/myoung34/docker-github-actions-runner).

```yaml
name: Docker Stack Deployment
env:
  GCP_SA_CREDENTIALS: <service_account_credentials>
  GCP_ZONE: 'us-central1-a'
  GCP_VM_NAME: '<vm-name>'
  GCP_PROJECT_ID: '<project_id>'

  SSH_USER: '<username>'

  CTX_NAME: '<ctx_name>'
  STACK_NAME: '<stack_name>'

on:
  workflow_dispatch:

jobs:
  deploy-containers:
    runs-on: self-hosted
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
      - name: 'Checkout'
        uses: 'actions/checkout@v2'

      - name: Authenticate gcloud CLI
        uses: 'google-github-actions/auth@v2'
        with:
          credentials_json: ${{ env.GCP_SA_CREDENTIALS }}
          project_id: ${{ env.GCP_PROJECT_ID }}

      - name: 'Set up Cloud SDK'
        uses: 'google-github-actions/setup-gcloud@v2'
        with:
          version: '>= 363.0.0'

      # This step creates the gcloud compute SSH key
      # that will be used on the SSH host for the Docker context
      - name: Generate ephemeral ssh key
        run: |
          mkdir -p ~/.ssh

          ssh-keygen -t ed25519 -f ~/.ssh/google_compute_engine -N "" -C "${{ env.SSH_USER }}"
          chmod 600 ~/.ssh/google_compute_engine

          CLOUDSDK_CORE_DISABLE_PROMPTS=1 gcloud compute ssh "${{ env.SSH_USER }}@${{ env.GCP_VM_NAME }}" \
          --tunnel-through-iap \
          --zone "${{ env.GCP_ZONE }}" \
          --project "${{ env.GCP_PROJECT_ID }}" \
          --quiet \
          --ssh-key-expire-after=5m \
          -- -o StrictHostKeyChecking=accept-new -o LogLevel=ERROR true

      # Create SSH config for Docker context,
      # specifically using a gcloud IAP tunnel to securely connect to the VM
      - name: Create SSH Host
        run: |
          echo "Host ${{ env.GCP_PROJECT_ID }}-${{ env.GCP_VM_NAME }}" >> ~/.ssh/config
          echo "  HostName compute.${{ env.GCP_VM_NAME }}" >> ~/.ssh/config
          echo "  User ${{ env.SSH_USER }}" >> ~/.ssh/config
          echo "  ProxyCommand gcloud compute start-iap-tunnel ${{ env.GCP_VM_NAME }} 22 --listen-on-stdin --project ${{ env.GCP_PROJECT_ID }} --zone ${{ env.GCP_ZONE }}" >> ~/.ssh/config
          echo "  IdentityFile ~/.ssh/google_compute_engine" >> ~/.ssh/config
          echo "  IdentitiesOnly yes" >> ~/.ssh/config
          echo "  StrictHostKeyChecking accept-new" >> ~/.ssh/config

          chmod 600 ~/.ssh/config

      # Setup the env file for the docker stack deployment
      - name: Create env file
        run: |
          echo VAR_1=value_1 >> .env
          echo VAR_2=value_2 >> .env
          echo VAR_3=value_3 >> .env

      # Ensures the Docker context exists before deployment
      - name: Create Docker SSH context
        run: |
          docker context create ${{ env.CTX_NAME }} \
          --docker "host=ssh://${{ env.GCP_PROJECT_ID }}-${{ env.GCP_VM_NAME }}"

      # Deploy docker stack using the created context and env file,
      # with envsubst to populate variables
      - name: Deploy Stack
        run: |
          gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
          docker context use ${{ env.CTX_NAME }}
          (set -a; . ./.env; envsubst < docker-stack-dev.yml) \
          | docker stack deploy --with-registry-auth -c - ${{ env.STACK_NAME }} --detach=false

      # Always clean up SSH credentials, env, and Docker context, no matter the workflow status
      - name: Cleanup
        if: ${{ always() }}
        run: |
          shred -u ~/.ssh/google_compute_engine \
          ~/.ssh/google_compute_engine.pub || true
          rm .env
          docker context rm ${{ env.STACK_NAME }} -f
```
