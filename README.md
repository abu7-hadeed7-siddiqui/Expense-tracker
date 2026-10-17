# Cloud-Based Expense Tracker with CI/CD Automation

> **Academic College Project**: Cloud-Based Expense Tracker with CI/CD Automation using AWS EC2, Docker, Jenkins, and Kubernetes.  
> **Student Demo & Viva Guide**: Beginner-friendly, low-cost, with a verified Docker, Jenkins, Kubernetes and AWS EC2 workflow.

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
13. [AWS EC2 Deployment (What Was Actually Done)](#13-aws-ec2-deployment-what-was-actually-done)
14. [Viva & Oral Exam Preparation Guide (Core DevOps Concepts)](#14-viva--oral-exam-preparation-guide-core-devops-concepts)
15. [3-5 Minute Video Demonstration Script & Checklist](#15-3-5-minute-video-demonstration-script--checklist)
16. [Troubleshooting Guide](#16-troubleshooting-guide)
17. [Security Considerations](#17-security-considerations)
18. [Complete AWS Teardown & Cost Cleanup Checklist](#18-complete-aws-teardown--cost-cleanup-checklist)
19. [Limitations](#19-limitations)

---

## 1. Project Overview & Objectives

Managing personal student and household expenses requires an intuitive interface, accurate calculations, and instantaneous visual feedback. Furthermore, modern software engineering demands automated pipelines where code is automatically tested and packaged into containers, then deployed to infrastructure.

### Core Objectives:
- Develop a full-stack, responsive financial tracker with real-time KPI metrics and Chart.js analytics.
- Implement parameterized RESTful API endpoints using Python Flask and SQLite.
- Guarantee containerized reproducibility via a hardened Docker image running the Gunicorn WSGI server.
- Automate continuous integration (install, test, build) via a declarative Jenkins pipeline.
- Orchestrate deployment on Kubernetes using single-replica persistence with Persistent Volumes and Health Probes.
- Deploy the containerized application to an AWS EC2 instance using a low-cost setup (Free Plan credits, no load balancer, no EKS).

---

## 2. Problem Statement

Traditional university projects often remain confined to `localhost:5000` or rely on fragile manual deployments ("it works on my machine"). When students transition code to cloud environments, they frequently encounter environment incompatibilities, configuration drift, data corruption, and unintended AWS bills due to misconfigured load balancers, NAT gateways, or unreleased EBS volumes.

This project addresses this with a documented DevOps workflow that is lightweight, cost-aware, and straightforward to demonstrate to academic evaluators.

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
| **Containerization** | Docker, Docker Compose | Slim image, non-root user, health check |
| **CI/CD** | Jenkins | Declarative pipeline: prepare source, install dependencies, run tests, build Docker image, clean workspace (push and Kubernetes deploy stages exist but are disabled) |
| **Orchestration** | Kubernetes (Docker Desktop / Minikube / k3s) | Single-replica Deployment, NodePort Service, PV, PVC, and HTTP probes |
| **Cloud Hosting** | AWS EC2 (t3.micro, Ubuntu) | Single Linux virtual server running the Docker container |

---

## 5. Architecture & CI/CD Pipeline

```
 +-----------------------------------------------------------------------------------+
 |                                   DEVELOPER                                       |
 |                       Local Code Changes -> project folder                        |
 +-----------------------------------------+-----------------------------------------+
                                           |
                                           v
 +-----------------------------------------------------------------------------------+
 |                               JENKINS CI SERVER (Docker)                          |
 |  1. Get Source -> 2. Install Deps -> 3. Run Pytest (14) -> 4. Docker Build        |
 |  (Push Image and Deploy to Kubernetes stages exist but are disabled by default)   |
 +-----------------------------------------+-----------------------------------------+
                                           |  image: expense-tracker:jenkins-<n>
                                           v
 +-----------------------------------------------------------------------------------+
 |           KUBERNETES (local, manual kubectl)   /   AWS EC2 (manual docker run)    |
 |                                                                                   |
 |   +------------------------+             +------------------------------------+   |
 |   | Service (NodePort)     | ----------> | Pod / Container: expense-tracker   |   |
 |   +------------------------+             | Flask + Gunicorn WSGI Server       |   |
 |                                          +-----------------+------------------+   |
 |                                                            |                      |
 |                                          +-----------------v------------------+   |
 |                                          | Persistent storage (PVC / volume)  |   |
 |                                          | Mounted at /app/data/expenses.db   |   |
 |                                          +------------------------------------+   |
 +-----------------------------------------------------------------------------------+
```

> **Scope note:** In this submission Jenkins performs the CI part (source, dependencies, tests, image build). Deployment to Kubernetes and to AWS EC2 was done **manually** (`kubectl apply` and `docker run`). Automatic push and deploy stages are listed as future improvements (see Limitations).

---

## 6. Project Structure

```
expense-tracker/
├── app.py                      # Flask backend API, SQLite queries, seed data
├── requirements.txt            # Python dependencies (Flask, Gunicorn)
├── Dockerfile                  # Slim Docker image with non-root security
├── docker-compose.yaml         # Local container orchestration with persistent volume
├── Jenkinsfile                 # Declarative CI pipeline definition
├── .dockerignore               # Docker build context exclusions
├── .gitignore                  # Git tracking exclusions (credentials, databases, venv)
├── README.md                   # Project documentation and viva manual
├── templates/
│   └── index.html              # Responsive dashboard, modals, KPI cards, analytics
├── static/
│   ├── css/
│   │   └── style.css           # Custom stylesheet with responsive grid
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
- **Why SQLite?** SQLite is self-contained, serverless, and stores data in a single file (`expenses.db`). It eliminates the memory overhead and hourly hosting charges of managed cloud databases like Amazon RDS.
- **The Concurrency & Replica Limitation:** SQLite uses file-level locking (`database is locked` on simultaneous writes). If multiple Kubernetes Pod replicas share the same SQLite file across a network filesystem, write collisions and lock timeouts can occur.
- **Architectural Solution:** Kubernetes is configured with **exactly 1 replica** (`replicas: 1`). The database file is stored in `/app/data/expenses.db` mounted via a dedicated `PersistentVolumeClaim` (and a Docker named volume in Docker/EC2). This avoids data loss across container restarts and avoids concurrency corruption.
- *Note for Production Scaling:* If scaling horizontally to N > 1 replicas, PostgreSQL or MySQL would be used instead.

---

## 8. Local Installation & Quickstart

### Prerequisites
- Python 3.10+ installed
- Git installed (optional)

### Steps

1. **Get the project** (clone it, or use the project folder directly):
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
python -m pytest tests/test_app.py -v
```
(`python -m pytest` is used so the project root is on the Python path.)

Result in this project: **14 passed**, both locally in a Python container and inside the Jenkins pipeline.

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

Jenkins runs in Docker (`jenkins-server`, http://localhost:8080) with the Docker socket and the project folder mounted (the project is available inside the container as `/project`).

### Pipeline stages (verified: Jenkins build finished with `Finished: SUCCESS`)

| Stage | What it does |
|---|---|
| Get Source | Copies the project from the mounted `/project` folder into the Jenkins workspace |
| Install Dependencies | Creates a Python virtual environment and installs `requirements.txt` plus pytest |
| Run Tests | Runs `python -m pytest tests/test_app.py -v` (14 tests) |
| Build Docker Image | Builds `expense-tracker:jenkins-<build number>` using the mounted Docker socket |
| Push Image | Skipped by default (`PUSH_IMAGE=false`); not performed in this demo |
| Deploy to Kubernetes | Skipped by default (`DEPLOY_K8S=false`); not automated in this demo |
| Post Actions | Prints the result and cleans the workspace (cleanup errors are caught) |

### Why the source is copied instead of cloned with Git
The Jenkins Git plugin blocks checkouts from a local directory (`/project`) by default. For this local demo the pipeline copies the files from the mounted folder instead of weakening that security setting. In a real setup, the job would use "Pipeline script from SCM" with a GitHub repository URL and a webhook.

### Job setup
1. Open Jenkins -> New Item -> Pipeline, name it `expense-tracker-pipeline`.
2. Under Pipeline choose **Pipeline script** and paste the contents of the `Jenkinsfile` in this repository.
3. Save, then click **Build with Parameters** (leave `PUSH_IMAGE` and `DEPLOY_K8S` unticked).
4. Open the build's Console Output; a successful run shows `14 passed` and ends with `Finished: SUCCESS`.

### Optional: Docker Hub push (not used in this demo)
Pushing would require a Jenkins credential (`dockerhub-credentials`, username plus a Docker Hub access token). Never commit tokens to the repository.

---

## 12. Kubernetes Deployment (Minikube / k3s)

Tested locally on the Docker Desktop Kubernetes cluster: pod `1/1 Running`, service exposed on NodePort 30080, PVC `Bound`, dashboard reachable through `kubectl port-forward`.

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
kubectl get pods -l app=expense-tracker
kubectl get pvc
kubectl get svc expense-tracker-service
```

### 4. Access the Application:
- Docker Desktop / any cluster (reliable option):
  ```bash
  kubectl port-forward service/expense-tracker-service 8081:5000
  ```
  Then open `http://localhost:8081`.
- If using Minikube:
  ```bash
  minikube service expense-tracker-service --url
  ```

### 5. Tear Down:
```bash
kubectl delete -f k8s/deployment.yaml
kubectl delete -f k8s/service.yaml
kubectl delete -f k8s/persistent-volume-claim.yaml
kubectl delete -f k8s/persistent-volume.yaml
```

---

## 13. AWS EC2 Deployment (What Was Actually Done)

### Summary of what runs where

| Component | Where it ran | How it was done |
|---|---|---|
| Flask app in Docker (public demo) | **AWS EC2** (Ubuntu, t3.micro, us-east-1) | Manual: project copied with `scp`, image built on the server, container started with `docker run` |
| Persistent SQLite data | **AWS EC2**, Docker named volume `expense_data` at `/app/data` | Verified: container restarted and data was still present |
| Jenkins pipeline | **Local machine** (Docker Desktop) | Copy source, install dependencies, run 14 tests, build image, clean workspace |
| Kubernetes (Deployment, Service, PV, PVC) | **Local machine** (Docker Desktop cluster) | Applied with `kubectl`; pod Running, PVC Bound |

### Important notes (honest scope)
- The EC2 deployment was done **manually**. Jenkins did **not** deploy to EC2 and did not push the image to a registry.
- Jenkins and Kubernetes were **not** run on EC2, because a 1 GiB t3.micro cannot comfortably run all of them together.
- The EC2 instance was **terminated after the demonstration** to avoid charges, so the public URL is no longer active. The deployment is shown in the demonstration video.

### Resource choices

| Resource | Choice | Notes |
|---|---|---|
| Instance type | `t3.micro` (Free tier eligible) | 2 vCPU, 1 GiB RAM |
| OS | Ubuntu Server | Docker installed with `apt` |
| Storage | 8 GiB gp3 root volume | Deleted automatically on termination |
| Public IP | Auto-assigned public IPv4 (no Elastic IP) | Public IPv4 addresses can incur a per-hour charge outside free allowances |
| Load balancer / NAT / EKS | None | Avoids unnecessary paid services |

### Security group rules used
- **Port 22 (SSH)**: source `My IP` only.
- **Port 80 (HTTP)**: source `0.0.0.0/0` for the demo.
- Jenkins (8080) and Kubernetes ports were never exposed publicly.

### Deployment steps used
1. Launch one Ubuntu `t3.micro` instance (AWS Free Plan credits) and create a key pair (kept outside the project folder, never committed).
2. Install Docker on the server: `sudo apt-get update && sudo apt-get install -y docker.io`.
3. Copy the project (excluding `.git`, caches and the virtual environment) with `scp`, extract it, and build:
   `sudo docker build -t expense-tracker:latest .`
4. Run with a persistent volume, mapping port 80 to the container's port 5000:
   `sudo docker run -d --name expense-tracker-app --restart unless-stopped -p 80:5000 -v expense_data:/app/data expense-tracker:latest`
5. Verify: open `http://<public-ip>/`, check `/health`, add and edit an expense, restart the container (`sudo docker restart expense-tracker-app`) and confirm the data persists.

### Cost controls
- AWS Budgets zero-spend alert configured; account on the AWS Free Plan with credits.
- Instance terminated right after the demonstration; teardown checklist in section 18.

---

## 14. Viva & Oral Exam Preparation Guide (Core DevOps Concepts)

Prepare for questions your teacher/examiner may ask:

### 1. What is CI/CD?
- **Continuous Integration (CI)**: The automated practice where code changes trigger automated installs, builds and tests (`pytest`) to detect bugs early.
- **Continuous Deployment (CD)**: The automated process where successfully tested code is packaged into containers and deployed to environments (`Kubernetes` / `AWS`). In this project the CI part is automated in Jenkins; deployment was performed manually.

### 2. What is the difference between a Container and an Image?
- A **Docker Image** is a read-only, immutable blueprint (template) containing the application code, libraries, and runtime dependencies.
- A **Docker Container** is a running instance of that image, isolated via Linux namespaces and cgroups.

### 3. Why use Docker instead of a Virtual Machine?
- Containers share the host operating system kernel and isolate processes at the OS level, making them lightweight, fast to start, and resource-efficient.

### 4. What is Kubernetes (K8s)?
- Kubernetes is an open-source container orchestration platform that automates container deployment, scaling, health monitoring, self-healing, and networking.

### 5. Explain Deployment, Service, and Persistent Volume:
- **Deployment**: Declares the desired state of pods (replicas, image, probes, restart policy).
- **Service**: A stable networking entry point (NodePort / ClusterIP) that routes traffic to pods, even if pods are replaced.
- **Persistent Volume (PV)**: Storage that exists independently of the pod lifecycle. If a pod restarts, data in the PV remains intact.

### 6. What are Kubernetes Liveness and Readiness Probes?
- **Liveness Probe**: Checks if the container is still alive. If `/health` fails, Kubernetes restarts the pod.
- **Readiness Probe**: Checks if the container is ready to accept traffic. If failing, traffic is not routed to that pod.

### 7. Why Gunicorn instead of Flask's built-in development server?
- Flask's `app.run()` is intended for local debugging. Gunicorn is a production-grade WSGI server that runs multiple worker processes to handle concurrent requests.

### 8. Why did the first Jenkins build fail and how did you fix it?
- The Jenkins Git plugin blocks checkouts from a local directory by default. Instead of weakening that security setting, the pipeline copies the source from the mounted `/project` folder. The workspace-cleanup step is also wrapped in try/catch so a failed run does not cause a second error.

### 9. Does your pipeline deploy to AWS or Kubernetes?
- No. Jenkins installs dependencies, runs 14 tests and builds a Docker image. Push and deploy stages exist but are disabled. Kubernetes and EC2 deployments were performed manually.

---

## 15. 3-5 Minute Video Demonstration Script & Checklist

### Preparation Checklist Before Recording:
- [ ] Application running (on EC2 for the cloud part; locally for Docker/Kubernetes).
- [ ] Windows ready: browser with the app and `/health`, SSH window to the server, local PowerShell, Jenkins build page, EC2 instances page.
- [ ] Nothing sensitive visible: no `.pem` key, no AWS account ID or email, no billing page, no tokens.

### Script & Timestamp Breakdown:

| Time | Stage | Actions & Script |
|---|---|---|
| **0:00 - 0:30** | **1. Introduction** | *"This is my Cloud-Based Expense Tracker using AWS EC2, Docker, Jenkins and Kubernetes."* Briefly show the architecture diagram. |
| **0:30 - 1:30** | **2. Cloud app & CRUD** | Open the EC2 public URL. Show the dashboard, add, edit and delete an expense. Open `/health`. |
| **1:30 - 2:15** | **3. Docker on EC2** | In the SSH window run `sudo docker ps` and `sudo docker volume ls`. Restart the container and refresh the browser to show data persists. |
| **2:15 - 3:15** | **4. Jenkins & tests** | Show the Jenkins Stages view and Console Output: `14 passed` and `Finished: SUCCESS`. |
| **3:15 - 3:50** | **5. Kubernetes (local)** | Run `kubectl get pods,svc,pvc`. Explain single replica, 1Gi PV and the `/health` probe. |
| **3:50 - 4:20** | **6. AWS console & conclusion** | Show the EC2 instance running. Then state honestly: *"The app runs on EC2 in Docker, deployed manually. Jenkins builds and tests the image; Kubernetes ran locally. Automatic deployment is a future improvement."* |

---

## 16. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| `database is locked` | Concurrency lock on SQLite file | Ensure only 1 pod replica is running (`replicas: 1`). |
| Public URL not loading on EC2 | Security group not allowing the web port, or browser forcing https | Allow the web port (80 in this setup) in the security group and use `http://`, not `https://`. |
| Jenkins checkout error about a local directory | Git plugin blocks local-path checkouts | Use the copy-from-`/project` pipeline described in section 11. |
| Jenkins: `No module named 'app'` | Project root not on the Python path | Run tests with `python -m pytest` and `PYTHONPATH=$WORKSPACE`. |
| Jenkins: docker permission denied | Jenkins user cannot use the Docker socket | Fix the socket permissions inside the Jenkins container for this local demo. |
| `ssh` says the private key is too open | Key file readable by other users | Restrict the key file permissions (`icacls` on Windows). |
| Out of Memory (OOM) on a 1 GiB instance | Too many services on a small server | Run only the Docker container on EC2; run Jenkins and Kubernetes locally. |
| Health check returns 500 | Database path directory not writable | Verify `/app/data` is writable by the container user. |

---

## 17. Security Considerations

- **Non-Root Docker User**: The Docker container runs as `appuser` to follow the principle of least privilege.
- **SQL Injection Prevention**: All SQL queries in `app.py` use parameterized placeholders (`?`).
- **Strict Input Validation**: Amounts, dates, and categories are validated on the server (and client).
- **Credential Safety**: No AWS keys, passwords, or tokens are committed. The `.gitignore` excludes private keys, environment files, and credentials. The EC2 key pair was kept outside the project folder and deleted after the demo.
- **Network Isolation**: SSH was restricted to one IP; only the web port was public; Jenkins and Kubernetes management ports were never exposed.
- **Docker socket mounted into Jenkins**: Gives Jenkins control of the host Docker daemon. Acceptable for a local demo only.

---

## 18. Complete AWS Teardown & Cost Cleanup Checklist

> **CRITICAL RULE**: Merely "stopping" an EC2 instance can continue to incur charges for EBS volumes and public IPv4 addresses. **TERMINATE** the instance and verify related resources.

### Teardown Steps (use the same region you launched in):

1. **Terminate EC2 Instance**: EC2 -> Instances -> select it -> Instance State -> Terminate. Wait for `Terminated`.
2. **Verify EBS Volume Deletion**: EC2 -> Elastic Block Store -> Volumes. Delete any volume with status `available`.
3. **Check Elastic IPs**: EC2 -> Network & Security -> Elastic IPs. Release any that exist.
4. **Review AMIs & Snapshots**: deregister custom AMIs and delete snapshots created during the project.
5. **Delete key pair and security group**: remove the key pair and the `launch-wizard-*` security group; delete the local `.pem` file.
6. **Ensure no extra services**: no Load Balancers, NAT Gateways or EKS clusters.
7. **Check Billing**: Billing -> Bills and Free Tier. Usage data can take up to 24 hours to appear, so check again the next day and keep a zero-spend budget alert until verified.

---

## 19. Limitations

- Jenkins builds and tests the image but does **not** push it to a registry or deploy it to Kubernetes or EC2; those deployments were done manually.
- Kubernetes runs on a single-node local cluster (Docker Desktop), not a production, highly available cluster.
- SQLite is a single-file database: suitable for a demo, not for multiple replicas or heavy concurrent writes. The deployment therefore uses one replica.
- The persistent volume uses `Retain` on a local node; data survives pod restarts but is lost if the cluster is deleted.
- There is no user authentication; the application is single-user.
- The Jenkins pipeline copies source from a mounted folder instead of a Git repository with webhooks.
- Jenkins uses the host Docker socket, which gives the pipeline full control of the host Docker daemon (local demo only).
- The AWS EC2 instance was terminated after the demonstration; the public URL is no longer active.