# Cloud-Based Expense Tracker with CI/CD Automation

> **Academic College Project**: Cloud-Based Expense Tracker with CI/CD Automation using AWS EC2, Docker, Jenkins, and Kubernetes.  
> **Student Demo & Viva Guide**: Beginner-friendly, zero unnecessary cloud expense, fully functional end-to-end DevOps automation.

---

## Table of Contents
1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [Problem Statement](#2-problem-statement)
3. [Key Features](#3-key-features)
4. [Technology Stack](#4-technology-stack)
5. [Architecture & CI/CD Pipeline](#5-architecture--cicd-pipeline)
6. [Project Structure](#6-project-structure)
7. [Database Architecture & Design Decision](#7-database-architecture--design-decision)
8. [Local Installation & Quickstart](#8-local-installation--quickstart)
9. [Automated Testing](#9-automated-testing)
10. [Docker Setup & Containerization](#10-docker-setup--containerization)
11. [Jenkins CI/CD Pipeline Setup](#11-jenkins-cicd-pipeline-setup)
12. [Kubernetes Deployment (Minikube / k3s)](#12-kubernetes-deployment-minikube--k3s)
13. [AWS EC2 Deployment & Cost-Safety Guide](#13-aws-ec2-deployment--cost-safety-guide)
14. [Viva & Oral Exam Preparation Guide (Core DevOps Concepts)](#14-viva--oral-exam-preparation-guide-core-devops-concepts)
15. [3–5 Minute Video Demonstration Script & Checklist](#15-35-minute-video-demonstration-script--checklist)
16. [Troubleshooting Guide](#16-troubleshooting-guide)
17. [Security Considerations](#17-security-considerations)
18. [Complete AWS Teardown & Cost Cleanup Checklist](#18-complete-aws-teardown--cost-cleanup-checklist)

---

## 1. Project Overview & Objectives

Managing personal student and household expenses requires an intuitive interface, accurate calculations, and instantaneous visual feedback. Furthermore, modern software engineering demands automated deployment pipelines where code pushed to a version control system is automatically tested, containerized, and deployed to cloud infrastructure.

### Core Objectives:
- Develop a full-stack, responsive financial tracker with real-time KPI metrics and Chart.js analytics.
- Implement parameterized RESTful API endpoints using Python Flask and SQLite.
- Guarantee containerized reproducibility via a hardened Docker image running the Gunicorn WSGI server.
- Automate continuous integration and continuous deployment (CI/CD) via a declarative Jenkins pipeline.
- Orchestrate deployment on Kubernetes using single-replica persistence with Persistent Volumes and Health Probes.
- Deploy to an AWS EC2 instance strictly within Free-Tier limits with zero surprise charges.

---

## 2. Problem Statement

Traditional university projects often remain confined to `localhost:5000` or rely on fragile manual deployments ("it works on my machine"). When students transition code to cloud environments, they frequently encounter environment incompatibilities, configuration drift, data corruption, and unintended AWS bills due to misconfigured load balancers, NAT gateways, or unreleased EBS volumes.

This project solves this by delivering an end-to-end, automated DevOps workflow that is lightweight, fully documented, cost-safe, and straightforward to demonstrate to academic evaluators.

---

## 3. Key Features

- **Dashboard KPI Metrics**: Live calculations of Total Expenses, Current Month Spending, Transaction Count, and Top Category.
- **Visual Analytics**: Interactive Category-wise Doughnut Chart and Monthly Spending Trend Bar Chart powered by Chart.js.
- **Complete CRUD Functionality**: Add, view, edit, and delete transactions with confirmation modals.
- **Advanced Filtering**: Filter transactions simultaneously by search keywords, categories, and specific months or date ranges.
- **Automated Health Probes**: `/health` endpoint returning database status for Kubernetes liveness/readiness probes.
- **One-Click Viva Demo Reset**: "Reset Demo Data" button to restore clean, realistic demonstration data instantly during an exam.
- **Zero Paid Cloud Dependencies**: Avoids paid Amazon EKS, AWS Application Load Balancers, and paid RDS databases.

---

## 4. Technology Stack

| Layer | Technology | Rationale / Choice |
|---|---|---|
| **Frontend** | HTML5, CSS3, Modern JavaScript (ES6+), Chart.js | Lightweight single-page interface, fast rendering, no heavy node_modules build step |
| **Backend** | Python 3 (Flask) | Minimalist, clean REST API, fast startup, highly readable for college viva |
| **Production WSGI** | Gunicorn | Production WSGI server (2 workers, 2 threads) for concurrency inside containers |
| **Database** | SQLite3 | File-based SQL database, zero cloud storage cost, persistent volume mounted |
| **Testing** | Pytest | 14 automated unit and integration tests covering CRUD, filters, validation & health |
| **Containerization** | Docker, Docker Compose | Multi-stage slim image (`python:3.11-slim`), non-root user, health check |
| **CI/CD** | Jenkins | Declarative pipeline for test, build, push, and Kubernetes rollout |
| **Orchestration** | Kubernetes (Minikube / k3s) | Single-replica Deployment, NodePort Service, PV, PVC, and HTTP probes |
| **Cloud Hosting** | AWS EC2 (t2.micro / t3.micro) | Linux virtual server eligible for AWS Free Tier |

---

## 5. Architecture & CI/CD Pipeline

```
 +-----------------------------------------------------------------------------------+
 |                                   DEVELOPER                                       |
 |                       Local Code Changes -> git commit & push                     |
 +-----------------------------------------+-----------------------------------------+
                                           |
                                           v
 +-----------------------------------------------------------------------------------+
 |                                GITHUB REPOSITORY                                  |
 |                         Source Code, Dockerfile, Jenkinsfile                      |
 +-----------------------------------------+-----------------------------------------+
                                           | Webhook / Polling
                                           v
 +-----------------------------------------------------------------------------------+
 |                               JENKINS CI/CD SERVER                                |
 |  1. Checkout SCM -> 2. Run Pytest -> 3. Docker Build -> 4. Docker Push (Optional) |
 +-----------------------------------------+-----------------------------------------+
                                           | Deploy Manifests (kubectl)
                                           v
 +-----------------------------------------------------------------------------------+
 |                              KUBERNETES / AWS EC2                                 |
 |                                                                                   |
 |   +------------------------+             +------------------------------------+   |
 |   | NodePort Service:30080 | ----------> | Pod: expense-tracker (Replica: 1)  |   |
 |   +------------------------+             | Flask + Gunicorn WSGI Server       |   |
 |                                          +-----------------+------------------+   |
 |                                                            |                      |
 |                                          +-----------------v------------------+   |
 |                                          | PersistentVolumeClaim (PVC 1Gi)    |   |
 |                                          | Mounted at /app/data/expenses.db   |   |
 |                                          +------------------------------------+   |
 +-----------------------------------------------------------------------------------+
```

---

## 6. Project Structure

```
expense-tracker/
├── app.py                      # Flask backend API, SQLite queries, seed data
├── requirements.txt            # Python dependencies (Flask, Gunicorn, Pytest)
├── Dockerfile                  # Multi-layer slim Docker image with non-root security
├── docker-compose.yaml         # Local container orchestration with persistent volume
├── Jenkinsfile                 # Declarative CI/CD pipeline definition
├── .dockerignore               # Optimized Docker build context exclusions
├── .gitignore                  # Git tracking exclusions (credentials, databases, venv)
├── README.md                   # Comprehensive project documentation and viva manual
├── templates/
│   └── index.html              # Responsive dashboard, modals, KPI cards, analytics
├── static/
│   ├── css/
│   │   └── style.css           # Clean custom stylesheet with responsive grid
│   └── js/
│       └── app.js              # SPA logic, CRUD API calls, Chart.js renderers
├── tests/
│   └── test_app.py             # 14 automated pytest test cases
└── k8s/
    ├── persistent-volume.yaml  # 1Gi local host storage volume
    ├── persistent-volume-claim.yaml # Volume claim bound to the persistent volume
    ├── deployment.yaml         # Single-replica deployment with health probes
    └── service.yaml            # NodePort service exposing port 30080
```

---

## 7. Database Architecture & Design Decision

### Critical Architectural Rationale for Evaluators:
- **Why SQLite?** SQLite is self-contained, serverless, and stores data in a single file (`expenses.db`). It eliminates the memory overhead and hourly hosting charges of managed cloud databases like Amazon RDS (~$15-$25/month).
- **The Concurrency & Replica Limitation:** SQLite uses file-level locking (`database is locked` on simultaneous writes). If multiple Kubernetes Pod replicas share the same SQLite file across a network filesystem, write collisions and lock timeouts can occur.
- **Architectural Solution:** For this project, Kubernetes is configured with **exactly 1 replica** (`replicas: 1`). The database file is stored in `/app/data/expenses.db` mounted via a dedicated `PersistentVolumeClaim`. This guarantees zero data loss across container restarts while completely avoiding concurrency corruption.
- *Note for Production Scaling:* If scaling horizontally to $N > 1$ replicas in an enterprise environment, PostgreSQL or MySQL would be used instead.

---

## 8. Local Installation & Quickstart

### Prerequisites
- Python 3.10+ installed
- Git installed

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/expense-tracker.git
   cd expense-tracker
   ```

2. **Create and activate a virtual environment:**
   - On Windows (PowerShell):
     ```powershell
     py -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - On Linux / macOS:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the application:**
   ```bash
   python app.py
   ```
   Open your browser and navigate to: **`http://localhost:5000`**

---

## 9. Automated Testing

The project includes an automated test suite in `tests/test_app.py` utilizing `pytest`. Tests run against an isolated temporary database so demonstration data is never altered.

### Run Tests:
```bash
pytest tests/test_app.py -v
```

### Covered Test Cases:
1. `test_health_endpoint`: Asserts `/health` returns HTTP 200 with database status.
2. `test_add_expense_success`: Verifies adding a valid expense with Title, Category, Amount, and Date.
3. `test_list_expenses`: Verifies retrieval of all expenses.
4. `test_get_single_expense`: Verifies retrieving a specific record by ID.
5. `test_get_nonexistent_expense`: Confirms HTTP 404 on missing records.
6. `test_update_expense`: Tests `PUT` endpoint modifying an existing expense.
7. `test_delete_expense`: Tests `DELETE` endpoint and verifies removal.
8. `test_delete_nonexistent_expense`: Confirms HTTP 404 when deleting invalid ID.
9. `test_validation_invalid_amounts`: Rejects negative, zero, and non-numeric amounts (HTTP 400).
10. `test_validation_missing_fields`: Rejects missing titles, invalid categories, and bad dates (HTTP 400).
11. `test_filtering_by_category`: Asserts category filtering matches only selected categories.
12. `test_filtering_by_date_and_month`: Tests date range and `YYYY-MM` month filtering.
13. `test_summary_calculations`: Verifies totals, monthly breakdown, and highest category analytics.
14. `test_database_persistence`: Verifies data is genuinely written to disk.

---

## 10. Docker Setup & Containerization

### Building & Running with Docker
```bash
# 1. Build the production Docker image
docker build -t expense-tracker:latest .

# 2. Run container with persistent volume
docker run -d -p 5000:5000 -v expense_data:/app/data --name expense-tracker-app expense-tracker:latest

# 3. View running container status
docker ps

# 4. Check application logs
docker logs -f expense-tracker-app

# 5. Stop and remove container
docker stop expense-tracker-app
docker rm expense-tracker-app
```

### Running with Docker Compose (Recommended)
```bash
# Start container in background
docker compose up -d

# Check health and logs
docker compose ps
docker compose logs -f

# Stop and clean up
docker compose down
```

---

## 11. Jenkins CI/CD Pipeline Setup

The included `Jenkinsfile` automates the complete build, test, and deployment workflow.

### Setup Steps in Jenkins:
1. **Install Suggested Plugins**:
   - Git Plugin
   - Pipeline Plugin
   - Docker Pipeline Plugin
   - Credentials Binding Plugin

2. **Add Credentials** (Optional, only needed if pushing to Docker Hub):
   - Go to: `Manage Jenkins` -> `Credentials` -> `System` -> `Global credentials`
   - Add **Username with password**:
     - ID: `dockerhub-credentials`
     - Username: Your Docker Hub username
     - Password: Your Docker Hub Personal Access Token (PAT)

3. **Create Pipeline Job**:
   - New Item -> Name: `expense-tracker-pipeline` -> Select **Pipeline**.
   - Under **Pipeline Definition**, select **Pipeline script from SCM**.
   - SCM: **Git**
   - Repository URL: Your GitHub URL (e.g., `https://github.com/<user>/expense-tracker.git`).
   - Branch: `main` or `master`.
   - Script Path: `Jenkinsfile`.
   - Click **Save**.

4. **Trigger Build**:
   - Click **Build Now** (or **Build with Parameters** to toggle Docker Hub push and K8s rollout).
   - If tests fail, the pipeline halts immediately, preventing broken code from deploying.

---

## 12. Kubernetes Deployment (Minikube / k3s)

### 1. Start Local Cluster:
- With Minikube:
  ```bash
  minikube start --driver=docker
  ```
- Or with k3s (Linux / EC2):
  ```bash
  curl -sfL https://get.k3s.io | sh -
  ```

### 2. Deploy Manifests in Order:
```bash
# Step 1: Create storage volume and claim
kubectl apply -f k8s/persistent-volume.yaml
kubectl apply -f k8s/persistent-volume-claim.yaml

# Step 2: Deploy application and expose via NodePort service
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/deployment.yaml
```

### 3. Verify Deployment:
```bash
# Check pod status and health probes
kubectl get pods -l app=expense-tracker

# Check persistent volume binding
kubectl get pvc

# Check service port
kubectl get svc expense-tracker-service
```

### 4. Access the Application:
- If using Minikube:
  ```bash
  minikube service expense-tracker-service --url
  ```
- If using k3s on EC2 / Linux:
  Navigate to `http://<NODE-IP>:30080` (ensure security group port 30080 is open).

### 5. Tear Down:
```bash
kubectl delete -f k8s/deployment.yaml
kubectl delete -f k8s/service.yaml
kubectl delete -f k8s/persistent-volume-claim.yaml
kubectl delete -f k8s/persistent-volume.yaml
```

---

## 13. AWS EC2 Deployment & Cost-Safety Guide

### Proposed Architecture for Demonstration
To avoid charges, we recommend deploying to a **single Ubuntu EC2 instance** within the AWS Free Tier.

| Resource | Specification | Free Tier Eligibility | Notes |
|---|---|---|---|
| **Instance Type** | `t2.micro` (or `t3.micro` in regions where t2 is unavailable) | 750 hours/month Free Tier | 1 vCPU, 1 GB RAM |
| **OS** | Ubuntu 22.04 LTS or 24.04 LTS (HVM) | Free Tier Eligible | 64-bit (x86_64) |
| **Storage (EBS)** | 1x 20 GB gp3 / gp2 EBS Volume | 30 GB/month Free Tier | Enough for OS + Docker |
| **Elastic IP** | Do NOT allocate | Public IPv4 assigned automatically | AWS charges for unattached EIPs |
| **Load Balancer** | None | Expose via direct port / NodePort | Avoids ~$18/month ELB charge |

> **IMPORTANT MEMORY NOTE FOR 1GB RAM (t2.micro):**  
> Running Jenkins + Docker + Kubernetes simultaneously on 1GB RAM can cause out-of-memory (OOM) crashes.  
> **Recommended Demonstration Strategy**:  
> 1. Run the Flask application via **Docker** on the EC2 instance for the live cloud URL demonstration (`http://<EC2-PUBLIC-IP>:5000`).  
> 2. Run Jenkins and Minikube locally or sequentially, or add a 2GB Linux Swap file on EC2:  
>    `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

### Inbound Security Group Rules:
- **Port 22 (SSH)**: Source `My IP` (Restricted to your machine).
- **Port 5000 (Expense Tracker)**: Source `0.0.0.0/0` (For teacher evaluation / demo).
- **Port 30080 (Kubernetes NodePort)**: Optional, for direct K8s demo.
- *Never expose Jenkins port 8080 or Docker/Kubernetes management APIs publicly.*

---

## 14. Viva & Oral Exam Preparation Guide (Core DevOps Concepts)

Prepare for questions your teacher/examiner may ask:

### 1. What is CI/CD?
- **Continuous Integration (CI)**: The automated practice where developers regularly merge code into a central repository, triggering automated builds and tests (`pytest`) to detect bugs early.
- **Continuous Deployment (CD)**: The automated process where successfully tested code is automatically packaged into containers and deployed to staging or production environments (`Kubernetes` / `AWS`).

### 2. What is the difference between a Container and an Image?
- A **Docker Image** is a read-only, immutable blueprint (template) containing the application code, libraries, and runtime dependencies.
- A **Docker Container** is a running, stateful instance of that image, isolated via Linux namespaces and cgroups.

### 3. Why use Docker instead of a Virtual Machine?
- Containers share the host operating system kernel and isolate processes at the OS level, making them lightweight (~150MB vs ~15GB), fast to start (< 2 seconds vs 2 minutes), and resource-efficient.

### 4. What is Kubernetes (K8s)?
- Kubernetes is an open-source container orchestration platform that automates container deployment, scaling, health monitoring, self-healing, and networking.

### 5. Explain Deployment, Service, and Persistent Volume:
- **Deployment**: Declares the desired state of pods (e.g., number of replicas, image version, resource limits, restart policy).
- **Service**: Provides an abstraction and stable networking entry point (NodePort / ClusterIP) to route traffic to pods, even if pods die and receive new IP addresses.
- **Persistent Volume (PV)**: Physical piece of storage in the cluster that exists independently of the pod lifecycle. If a pod crashes or restarts, data in the PV remains intact.

### 6. What are Kubernetes Liveness and Readiness Probes?
- **Liveness Probe**: Checks if the container is still alive. If `/health` fails, Kubernetes restarts the pod.
- **Readiness Probe**: Checks if the container is ready to accept user traffic. If failing, traffic is not routed to that pod until it returns HTTP 200.

### 7. Why Gunicorn instead of Flask's built-in development server?
- Flask's `app.run()` is single-threaded and intended solely for local debugging. Gunicorn is a production-grade WSGI HTTP server that forks pre-configured worker processes to handle concurrent requests safely.

---

## 15. 3–5 Minute Video Demonstration Script & Checklist

### Preparation Checklist Before Recording:
- [ ] Application running (locally or on EC2).
- [ ] Terminal ready with `docker ps`, `kubectl get pods`, and `pytest`.
- [ ] Browser open with 2 tabs: Expense Tracker Dashboard and Jenkins Pipeline.

### Script & Timestamp Breakdown:

| Time | Stage | Actions & Script |
|---|---|---|
| **0:00 - 0:35** | **1. Introduction** | *"Hello everyone. Today I am presenting my final project: a Cloud-Based Expense Tracker with automated CI/CD using AWS EC2, Docker, Jenkins, and Kubernetes."* Briefly show the architecture diagram. |
| **0:35 - 1:25** | **2. Dashboard & CRUD** | Show the live dashboard. Point out the KPI cards (Total Expenses, Current Month, Top Category). Click **Add Expense** (e.g., "Library Books", $85, Education). Show the table update and the Chart.js doughnut chart recalculate instantly. Edit and delete an entry to prove full CRUD. |
| **1:25 - 2:00** | **3. Automated Testing** | Switch to terminal. Run `pytest tests/test_app.py -v`. Show all 14 tests passing green. Explain that testing is fully automated in the pipeline. |
| **2:00 - 2:45** | **4. Docker & Jenkins** | Show `docker-compose.yaml` and run `docker ps` to display the running Gunicorn container. Open Jenkins, show the declarative stages (Checkout, Test, Build, Deploy), and click **Build Now** to show a green build run. |
| **2:45 - 3:30** | **5. Kubernetes & Probes** | Switch to terminal. Run `kubectl get pods -l app=expense-tracker` and `kubectl get svc`. Explain the single-replica SQLite architecture, the 1Gi PersistentVolume, and the `/health` liveness probe. |
| **3:30 - 4:00** | **6. AWS EC2 & Conclusion** | Open the browser at `http://<EC2-PUBLIC-IP>:5000` to show the application accessible live from the cloud. Conclude: *"In summary, the project demonstrates an end-to-end DevOps pipeline from code commit to cloud deployment with strict cost safety."* |

---

## 16. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| `database is locked` | Concurrency lock on SQLite file | Ensure only 1 pod replica is running (`replicas: 1` in `deployment.yaml`). |
| Port 5000 inaccessible on EC2 | AWS Security Group not allowing port 5000 | Open AWS EC2 Console -> Security Groups -> Inbound Rules -> Add Custom TCP `5000` from `Anywhere-IPv4` or your IP. |
| Jenkins build fails at `pytest` | Missing dependencies in Jenkins environment | Ensure Python 3 and `pip` are installed on the Jenkins worker, or configure virtualenv creation in `Jenkinsfile`. |
| Out of Memory (OOM) on t2.micro | t2.micro has only 1GB RAM | Add 2GB Swap space using `fallocate -l 2G /swapfile`. |
| Health check returns 500 | Database path directory not writable | Verify the `/app/data` directory is owned by the container user (`chown -R appuser:appuser /app/data`). |

---

## 17. Security Considerations

- **Non-Root Docker User**: The Docker container switches to user `appuser` (UID 1000) to adhere to the principle of least privilege.
- **SQL Injection Prevention**: All SQL queries in `app.py` use parameterized placeholders (`?`), completely preventing SQL injection attacks.
- **Strict Input Validation**: User amounts, dates, and category selections are validated both client-side and server-side.
- **Credential Safety**: No AWS keys, passwords, or tokens are committed to source control. The `.gitignore` excludes private keys, environment files, and credentials.
- **Network Isolation**: Jenkins administration and Kubernetes management ports are never exposed publicly on AWS.

---

## 18. Complete AWS Teardown & Cost Cleanup Checklist

> **CRITICAL RULE**: Merely "stopping" an EC2 instance continues to incur charges for provisioned EBS volumes and public IPv4 addresses. You must **TERMINATE** the instance and verify related resources.

### Teardown Steps:

1. **Terminate EC2 Instance**:
   - Go to **AWS Console** -> **EC2** -> **Instances**.
   - Select your instance -> **Instance State** -> **Terminate instance**.
   - Confirm termination. (Status will change to `Shutting-down` then `Terminated`).

2. **Verify EBS Volume Deletion**:
   - In EC2 Console, click **Elastic Block Store** -> **Volumes**.
   - Ensure the attached volume is removed automatically with the terminated instance.
   - If any volume shows status `available`, select **Actions** -> **Delete volume**.

3. **Check Elastic IPs (EIPs)**:
   - Go to **Network & Security** -> **Elastic IPs**.
   - AWS charges ~$0.005/hr for unused Elastic IPs. If an Elastic IP exists, click **Actions** -> **Release Elastic IP addresses**.

4. **Review Custom AMIs & Snapshots**:
   - Go to **Images** -> **AMIs** (deregister any custom image created).
   - Go to **Elastic Block Store** -> **Snapshots** (delete any created snapshots).

5. **Ensure No Unexpected Services Were Created**:
   - Verify no **Elastic Load Balancers** exist under **Load Balancers**.
   - Verify no **NAT Gateways** exist under **VPC** -> **NAT Gateways**.
   - Verify no **Amazon EKS** clusters were created.

6. **Check AWS Billing Dashboard**:
   - Open **AWS Billing & Cost Management Console**.
   - Click **Bills** and review Current Month charges.
   - *Note: AWS billing metrics can take up to 24 hours to refresh completely. Check again the following day.*
