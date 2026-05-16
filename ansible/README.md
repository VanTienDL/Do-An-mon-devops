# Ansible Automation

## 1. Mục đích

Thư mục Ansible này dùng để cấu hình EC2 Bastion / Management Host cho đồ án DevOps.

Trong đồ án, Terraform chịu trách nhiệm tạo hạ tầng AWS và EKS cluster. Sau khi hạ tầng đã sẵn sàng, Ansible được dùng để cấu hình Bastion Host.

Ansible được dùng để:

- Cài đặt các công cụ DevOps và Kubernetes.
- Cài đặt công cụ quét bảo mật và Compliance-as-Code.
- Cấu hình kubeconfig để Bastion Host kết nối tới AWS EKS.
- Hardening cơ bản cho server quản trị.
- Cài đặt và bật Node Exporter phục vụ monitoring.

## 2. Luồng kiến trúc

```text
Terraform
  -> Tạo VPC, Subnets, Security Groups, EKS Cluster, EKS Managed Node Group

EC2 Bastion / Management Host
  -> Hiện tại được tạo thủ công để demo
  -> Đóng vai trò máy chủ quản trị EKS

Ansible
  -> SSH vào EC2 Bastion
  -> Cài tool, cấu hình kubeconfig, hardening server

EKS Cluster
  -> Chạy ứng dụng microservices
  -> Được quản trị bằng kubectl/helm từ Bastion Host
```

Vì worker nodes được tạo bằng EKS Managed Node Group, các node này do AWS EKS quản lý. Do đó Ansible không SSH trực tiếp vào từng worker node, mà tập trung cấu hình Bastion / Management Host.

## 3. Cấu trúc thư mục

```text
ansible/
├── ansible.cfg
├── inventory.ini
├── group_vars/
│   └── all.yml
├── playbooks/
│   ├── setup_mgmt.yml
│   ├── configure-kubeconfig.yml
│   └── hardening.yml
└── roles/
    ├── common/
    ├── k8s_tools/
    ├── compliance/
    ├── security/
    └── monitoring/
```

## 4. Điều kiện cần có

### Máy local chạy Ansible

Máy dùng để chạy Ansible cần có:

- Ansible.
- SSH access tới EC2 Bastion Host.
- Private key dùng để SSH vào Bastion Host.

Cài Ansible trên macOS:

```bash
brew install ansible
```

Kiểm tra:

```bash
ansible --version
```

### Ansible collection

Project sử dụng `community.general`, ví dụ cho module `snap` và `ufw`.

Cài collection:

```bash
ansible-galaxy collection install community.general
```

## 5. Inventory

Inventory định nghĩa EC2 Bastion Host mà Ansible sẽ SSH vào.

File:

```text
ansible/inventory.ini
```

Cấu trúc:

```ini
[mgmt_host]
bastion ansible_host=<BASTION_PUBLIC_IP> ansible_user=ubuntu

[all:vars]
ansible_ssh_private_key_file=~/.ssh/devops-bastion-key.pem
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

Thay `<BASTION_PUBLIC_IP>` bằng public IPv4 của EC2 Bastion Host.

Lưu ý: trong môi trường production, Bastion EC2 nên được tạo bằng Terraform thay vì tạo thủ công. Với bản demo hiện tại, Bastion có thể được tạo thủ công để thuận tiện kiểm thử.

## 6. Biến cấu hình

Các biến dùng chung nằm trong:

```text
ansible/group_vars/all.yml
```

Các biến chính:

```yaml
aws_region: ap-southeast-1
eks_cluster_name: iac-dev-eks
node_exporter_version: "1.8.2"
kubeconfig_path: "{{ ansible_env.HOME }}/.kube/config"
kubeconfig_context_alias: "{{ eks_cluster_name }}"
```

Ý nghĩa:

- `aws_region`: Region AWS dùng cho EKS.
- `eks_cluster_name`: Tên EKS cluster được tạo bởi Terraform.
- `node_exporter_version`: Phiên bản Node Exporter.
- `kubeconfig_path`: Vị trí kubeconfig trên Bastion Host.
- `kubeconfig_context_alias`: Tên context kubectl.

## 7. Playbooks

### 7.1 `setup_mgmt.yml`

Mục đích:

Cài đặt các công cụ DevOps, Kubernetes, AWS và compliance trên Bastion Host.

Playbook gọi các role:

- `common`
- `k8s_tools`
- `compliance`

Các công cụ chính được cài:

- AWS CLI
- kubectl
- Helm
- eksctl
- Trivy
- Checkov
- tfsec
- Conftest
- Các tiện ích cơ bản như `curl`, `wget`, `git`, `jq`, `unzip`

Chạy:

```bash
cd ansible
ansible-playbook -i inventory.ini playbooks/setup_mgmt.yml
```

Kiểm tra:

```bash
ansible -i inventory.ini mgmt_host -m shell -a '
aws --version
kubectl version --client
helm version --short
eksctl version
trivy --version | head -n 1
checkov --version
conftest --version
tfsec --version
'
```

### 7.2 `configure-kubeconfig.yml`

Mục đích:

Cấu hình kubeconfig trên Bastion Host để `kubectl` có thể kết nối tới AWS EKS cluster.

Playbook này thực hiện:

- Kiểm tra biến `aws_region` và `eks_cluster_name`.
- Kiểm tra AWS identity bằng `aws sts get-caller-identity`.
- Chạy `aws eks update-kubeconfig`.
- Kiểm tra context hiện tại của kubectl.
- Kiểm tra kết nối cluster bằng `kubectl get nodes`.

Chạy:

```bash
cd ansible
ansible-playbook -i inventory.ini playbooks/configure-kubeconfig.yml
```

Kiểm tra kubeconfig:

```bash
ansible -i inventory.ini mgmt_host -m shell -a '
ls -l /home/ubuntu/.kube/config
grep server /home/ubuntu/.kube/config
' --become --become-user ubuntu
```

Kiểm tra kết nối EKS:

```bash
ansible -i inventory.ini mgmt_host -m shell -a '
KUBECONFIG=/home/ubuntu/.kube/config kubectl get nodes
' --become --become-user ubuntu
```

Kết quả mong đợi:

```text
NAME                                             STATUS
ip-xx-xx-xx-xx.ap-southeast-1.compute.internal   Ready
```

### 7.3 `hardening.yml`

Mục đích:

Hardening cơ bản cho Bastion / Management Host và cài Node Exporter.

Playbook chỉ target:

```yaml
hosts: mgmt_host
```

Lý do: worker nodes được quản lý bởi AWS EKS Managed Node Group, nên Ansible không SSH trực tiếp vào worker nodes.

Playbook gọi các role:

- `security`
- `monitoring`

Cấu hình chính:

- Tắt SSH root login.
- Tắt SSH password authentication.
- Tắt X11 forwarding.
- Bật UFW firewall.
- Bật fail2ban.
- Bật auditd.
- Bật unattended security upgrades.
- Cài đặt và start Node Exporter.

Chạy:

```bash
cd ansible
ansible-playbook -i inventory.ini playbooks/hardening.yml
```

Kiểm tra:

```bash
ansible -i inventory.ini mgmt_host -m shell -a '
echo "===== SSH hardening =====";
grep -E "^(PermitRootLogin|PasswordAuthentication|X11Forwarding)" /etc/ssh/sshd_config || true;

echo "===== Security services =====";
echo -n "fail2ban: "; systemctl is-active fail2ban;
echo -n "auditd: "; systemctl is-active auditd;
echo -n "node_exporter: "; systemctl is-active node_exporter;

echo "===== UFW firewall =====";
ufw status verbose;

echo "===== Node Exporter metrics =====";
curl -s http://localhost:9100/metrics | head -n 5;
'
```

Kết quả mong đợi:

```text
PermitRootLogin no
PasswordAuthentication no
X11Forwarding no
fail2ban: active
auditd: active
node_exporter: active
Status: active
# HELP ...
# TYPE ...
```

## 8. Thứ tự chạy đề xuất

```bash
cd ansible

ansible -i inventory.ini mgmt_host -m ping

ansible-playbook -i inventory.ini playbooks/setup_mgmt.yml

ansible-playbook -i inventory.ini playbooks/configure-kubeconfig.yml

ansible-playbook -i inventory.ini playbooks/hardening.yml
```

## 9. Tổng hợp lệnh kiểm tra

### Kiểm tra kết nối Ansible

```bash
ansible -i inventory.ini mgmt_host -m ping
```

Kết quả mong đợi:

```text
ping: pong
```

### Kiểm tra tool đã cài

```bash
ansible -i inventory.ini mgmt_host -m shell -a '
aws --version
kubectl version --client
helm version --short
eksctl version
trivy --version | head -n 1
checkov --version
conftest --version
tfsec --version
'
```

### Kiểm tra kết nối EKS

```bash
ansible -i inventory.ini mgmt_host -m shell -a '
KUBECONFIG=/home/ubuntu/.kube/config kubectl get nodes
' --become --become-user ubuntu
```

### Kiểm tra hardening

```bash
ansible -i inventory.ini mgmt_host -m shell -a '
grep -E "^(PermitRootLogin|PasswordAuthentication|X11Forwarding)" /etc/ssh/sshd_config || true
systemctl is-active fail2ban
systemctl is-active auditd
systemctl is-active node_exporter
ufw status verbose
'
```

## 10. Ghi chú triển khai

- Bastion Host được dùng làm management server cho EKS cluster.
- EKS worker nodes được quản lý bởi AWS EKS Managed Node Group, nên Ansible không SSH trực tiếp vào worker nodes.
- Trong demo hiện tại, EC2 Bastion Host có thể được tạo thủ công.
- Trong hướng production, EC2 Bastion Host nên được provision bằng Terraform để đảm bảo Infrastructure as Code đầy đủ.
- Port `9100` của Node Exporter nên được giới hạn cho Prometheus server hoặc internal CIDR, không nên mở rộng ra Internet.
- AWS credentials nên được cấp bằng IAM Role gắn với EC2 Bastion Host thay vì cấu hình access key thủ công.
- Không commit private key, AWS access key hoặc secret key vào repository.

## 11. Troubleshooting

### Ansible không SSH được vào Bastion

Kiểm tra SSH thủ công:

```bash
ssh -i ~/.ssh/devops-bastion-key.pem ubuntu@<BASTION_PUBLIC_IP>
```

Kiểm tra thêm:

- Bastion có public IPv4.
- Security Group cho phép SSH port `22` từ IP của máy local.
- Đường dẫn private key trong `inventory.ini` đúng.
- File private key có permission phù hợp, ví dụ `chmod 400 ~/.ssh/devops-bastion-key.pem`.

### `kubectl` kết nối tới `localhost:8080`

Lỗi này thường có nghĩa là kubeconfig chưa được dùng đúng.

Chạy:

```bash
KUBECONFIG=/home/ubuntu/.kube/config kubectl get nodes
```

Hoặc chạy lại playbook:

```bash
cd ansible
ansible-playbook -i inventory.ini playbooks/configure-kubeconfig.yml
```

### Lỗi AWS credentials

Nếu gặp lỗi:

```text
Unable to locate credentials
```

thì Bastion Host chưa có AWS credentials hoặc IAM Role phù hợp.

Kiểm tra:

```bash
aws sts get-caller-identity
```

### Timeout khi kết nối EKS

Nếu `kubectl get nodes` bị timeout, cần kiểm tra Security Group.

Bastion Security Group cần được phép truy cập EKS Cluster Security Group qua port `443`.

Ví dụ:

```bash
aws ec2 authorize-security-group-ingress \
  --region ap-southeast-1 \
  --group-id <EKS_CLUSTER_SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 443 \
  --source-group <BASTION_SECURITY_GROUP_ID>
```
