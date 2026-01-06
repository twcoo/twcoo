# WAN + 2LAN2 Setup

![WAN + 2LAN2 Setup](/wan_2lan2_setup.png)

## Prevent LAN 2 from accessing LAN 1

### 1. Login to Edgerouter dashboard

### 2. Go to `Firewall/NAT` tab

### 3. Click `Add Ruleset`

### 4. Set default action to `Drop`

### 5. Click `Save`

### 6. Edit created ruleset

### 7. Create rule to allow DNS

### 8. Create rule to allow DHCP

### 9. Go to `Interfaces` tab

### 10. Select `switch0` for interface

### 11. Select `local` for direction

### 12. Click `Save Ruleset`

![WAN + 2LAN2 Block In Local Switch 0](/wan_2lan2_block_in_local_switch_0.png)

![WAN + 2LAN2 Block In Local Switch 0 Ruleset](/wan_2lan2_block_in_local_switch_0_ruleset.png)
