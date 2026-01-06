# Creating A New Sudo User

## 1. Login as a root user

```bash
shh root@<server>
```

## 2. Add new user

```bash
adduser <username>
```

## 3. Add new user to sudo group

```bash
usermod -aG sudo <username>
```

## 4. Use the new user

```bash
su <username>
```
