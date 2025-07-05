# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c4d0bd77-922a-46ab-a74a-a9ebe9fd77fe

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c4d0bd77-922a-46ab-a74a-a9ebe9fd77fe) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Option 1: Lovable Hosting (Easiest)

Simply open [Lovable](https://lovable.dev/projects/c4d0bd77-922a-46ab-a74a-a9ebe9fd77fe) and click on Share -> Publish.

### Option 2: AWS Deployment with GitHub Actions

For full control and custom domain support, deploy to AWS using our automated CI/CD pipeline.

#### Prerequisites

1. **AWS Account** with programmatic access
2. **GitHub repository** connected to this project
3. **Terraform** knowledge (optional, but helpful for customization)

#### Setup Instructions

1. **Configure GitHub Secrets**
   
   In your GitHub repository, go to Settings → Secrets and variables → Actions, then add:

   **Required Secrets:**
   - `AWS_ACCESS_KEY_ID` - Your AWS access key
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

   **Required Variables:**
   - `BUCKET_NAME` - Unique S3 bucket name (e.g., `my-ai-portfolio-2024`)
   - `AWS_REGION` - AWS region (e.g., `us-east-1`)
   - `ENVIRONMENT` - Environment name (e.g., `production`)

2. **Create AWS User with Required Permissions**

   Create an IAM user with the following managed policies:
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
   - `AmazonRoute53FullAccess` (if using custom domain)
   - `AWSCertificateManagerFullAccess` (if using custom domain)

3. **Trigger Deployment**

   Push changes to the `main` branch or manually trigger the workflow from the Actions tab.

#### What the Pipeline Does

- ✅ Builds your React application
- ✅ Deploys AWS infrastructure (S3 + CloudFront) using Terraform
- ✅ Uploads your site files to S3
- ✅ Invalidates CloudFront cache for instant updates
- ✅ Provides secure HTTPS access via CloudFront

#### Manual Deployment

You can also deploy manually using the provided scripts:

```bash
# Build the application
./scripts/build.sh

# Deploy infrastructure (requires terraform/ directory)
./scripts/deploy-infrastructure.sh

# Deploy the site
./scripts/deploy-site.sh
```

For detailed AWS deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
