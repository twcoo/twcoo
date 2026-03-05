import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",
  title: "twcoo",
  description: "twcoo's site containing notes on anything related to tech.",
  head: [["link", { rel: "icon", href: "/butus.ico" }]],
  themeConfig: {
    logo: "/butus_logo.png",
    search: {
      provider: "local",
    },
    nav: [
      { text: "Notes", link: "/notes/prevent_suspend_on_lid_close" },
      { text: "Homelab", link: "/homelab/create_proxmox_vm_template.md" },
      { text: "Networking", link: "/networking/subnetting_ipv4.md" },
      { text: "Solar Power", link: "/solar_power/200w_solar_power_system.md" },
    ],
    sidebar: {
      "/notes/": [
        {
          text: "Notes",
          items: [
            {
              text: "Prevent Suspend On Lid Close",
              link: "/notes/prevent_suspend_on_lid_close.md",
            },
            { text: "Setting Up SSH", link: "/notes/setting_up_ssh.md" },
            {
              text: "Creating A New Sudo User",
              link: "/notes/creating_a_new_sudo_user.md",
            },
            {
              text: "Setting Up Unattended Upgrades",
              link: "/notes/setting_up_unattended_upgrades.md",
            },
            { text: "Setting Up Docker", link: "/notes/setting_up_docker.md" },
            { text: "Setting Up UFW", link: "/notes/setting_up_ufw.md" },
            {
              text: "Setting Up SSH Identity",
              link: "/notes/setting_up_ssh_identity.md",
            },
            {
              text: "Setting Up Docker Context",
              link: "/notes/setting_up_docker_context.md",
            },
            {
              text: "Setting Up SSL with Cloudflare and Certbot",
              link: "/notes/setting_up_ssl_with_cloudflare_and_certbot.md",
            },
            {
              text: "Setting Up Dozzle",
              link: "/notes/setting_up_dozzle.md",
            },
            {
              text: "SSH To GCloud VM Using IAP Tunnel",
              link: "/notes/ssh_to_gcloud_vm_using_iap_tunnel.md",
            },
            {
              text: "GitHub Workflow: Deploy Docker Stack to GCP VM",
              link: "/notes/ghwf_docker_stack_gcloud.md",
            },
            {
              text: "Basic K8s Setup With Ingress",
              link: "/notes/basic_k8s_setup_with_ingress.md",
            },
            {
              text: "Fix Unresponsive Docker",
              link: "/notes/fix_unresponsive_docker.md",
            },
            {
              text: "Routing Cloud Run Egress To A Static IP",
              link: "/notes/routing_cloud_run_egress_to_a_static_ip.md",
            },
            {
              text: "TCP Timeout Between Containers in Docker Swarm",
              link: "/notes/tcp_timeout_between_containers_in_docker_swarm.md",
            },
            {
              text: "Uploading Container Logs To GCS Using Vector",
              link: "/notes/uploading_container_logs_to_gcs_using_vector.md",
            },
            {
              text: "Self Hosted GitHub Runners With Docker Stack",
              link: "/notes/self_hosted_github_runners_with_docker_stack.md",
            },
            {
              text: "Setting Up K8 Cluster",
              link: "/notes/setting_up_k8_cluster.md",
            },
            {
              text: "Setting Up K8 Context",
              link: "/notes/setting_up_k8_context.md",
            },
            {
              text: "Overriding Cloud Init Hostname",
              link: "/notes/overriding_cloud_init_hostname.md",
            },
            {
              text: "Securing K8 Cluster",
              link: "/notes/securing_k8_cluster.md",
            },
            {
              text: "K8 Cert Manager Cluster Issuer",
              link: "/notes/k8_cert_manager_cluster_issuer.md",
            },

          ],
        },
      ],
      "/homelab/": [
        {
          text: "Homelab",
          items: [
            {
              text: "Create Proxmox VM Template",
              link: "/homelab/create_proxmox_vm_template.md",
            },
            {
              text: "Create Private Network With VM Bridge",
              link: "/homelab/create_private_network_with_vm_bridge.md",
            },
            {
              text: "TrueNas Proxmox VM Setup",
              link: "/homelab/truenas_proxmox_vm_setup.md",
            },
            {
              text: "Create Windows VM",
              link: "/homelab/create_windows_vm.md",
            },
            {
              text: "Mounting TrueNas NFS to Proxmox VM",
              link: "/homelab/mounting_truenas_nfs_to_proxmox_vm.md",
            },
            {
              text: "LXC Nginx Reverse Proxy With Certbot DNS Cloudflare",
              link: "/homelab/lxc_nginx_reverse_proxy_with_certbot_dns_cloudflare.md",
            },
            {
              text: "Wireguard and Proton VPN Setup",
              link: "/homelab/wireguard_and_proton_vpn_setup.md",
            },
            {
              text: "Setting Up Prometheus Exporters",
              link: "/homelab/setting_up_prometheus_exporters.md",
            },
            {
              text: "Kanboard K8 Deployment",
              link: "/homelab/kanboard_k8_deployment.md",
            },
          ],
        },
      ],
      "/networking/": [
        {
          text: "Networking",
          items: [
            {
              text: "Subnetting IPv4",
              link: "/networking/subnetting_ipv4.md",
            },
            {
              text: "WAN + 2LAN2 Setup",
              link: "/networking/wan_2lan2_setup.md",
            },
          ],
        },
      ],
      "/solar_power/": [
        {
          text: "Solar Power",
          items: [
            {
              text: "200W Solar Power System",
              link: "/solar_power/200w_solar_power_system.md",
            },
            {
              text: "How To Size A Circuit Breaker",
              link: "/solar_power/how_to_size_a_circuit_breaker.md",
            },
            {
              text: "How To Wire Size",
              link: "/solar_power/how_to_wire_size.md",
            },
          ],
        },
      ],
    },
    socialLinks: [{ icon: "github", link: "https://github.com/mfdebby" }],
    aside: false,
  },
});
