import { Link } from "react-router-dom";
import {
  ArrowLeft, Shield, Key, Database, Eye, Users, Server, ArrowRight,
  Layers, Cloud, Monitor, Wifi, Cpu, HardDrive, BarChart3, DollarSign,
  AlertTriangle, CircleCheck, Lock,
} from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline-variant/30 bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 font-label text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Gallery
              </Link>
              <span className="text-outline-variant/40">|</span>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h1 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">
                  Security Architecture
                </h1>
              </div>
            </div>
            <a
              href="/"
              className="font-label text-sm text-primary hover:text-primary/80 transition-colors"
            >
              &larr; Portfolio
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Workspace Security Architecture */}
        <section className="mb-12 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-headline text-lg text-on-surface">Workspace Security Architecture</h2>
          </div>
          <p className="font-body text-sm text-on-surface-variant/70 mb-6 max-w-2xl">
            Your credentials and files are protected by multiple layers of isolation. Here's how the workspace handles security for authenticated sessions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-label text-sm font-semibold text-on-surface">Per-User Isolation</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                Each user gets an isolated vault directory scoped by Cognito identity. Your files, intentions, and activity logs are invisible to other users. Path traversal is blocked by server-side validation.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-tertiary" />
                <span className="font-label text-sm font-semibold text-on-surface">OAuth Token Security</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                Your Claude Max plan OAuth token is stored in your private vault with owner-only permissions (chmod 600). API keys are stripped from agent processes — Claude authenticates via your per-user OAuth. One-click revocation available.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-accent-success" />
                <span className="font-label text-sm font-semibold text-on-surface">Encrypted Storage</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                Files stored on AWS EFS with AES-256 encryption at rest and TLS in transit. IAM-enforced access — only the workspace's ECS task role can mount the filesystem. No other services or containers can access your data.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-secondary" />
                <span className="font-label text-sm font-semibold text-on-surface">Tool Activity Auditing</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                Every Claude Code tool invocation is logged via PreToolUse hooks. A configurable policy file can block specific tools (e.g., deny Bash for read-only agents). Activity is visible in real-time in the workspace.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-on-surface-variant" />
                <span className="font-label text-sm font-semibold text-on-surface">Minimal IAM Scope</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                The container's IAM role has only EFS mount permissions — no access to S3, DynamoDB, Secrets Manager, or any other AWS service. Even the AWS CLI (installed for research tasks) has no usable credentials.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-error" />
                <span className="font-label text-sm font-semibold text-on-surface">Authentication</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                All workspace access requires GitHub OAuth via AWS Cognito at the ALB layer. Unauthenticated requests are redirected to login. Sessions last 12 hours before re-authentication.
              </p>
            </div>
          </div>
        </section>

        {/* Sandbox Isolation Deep Dive */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-surface-container-low/50 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="font-headline text-lg text-on-surface">Sandbox Isolation Deep Dive</h2>
          </div>
          <p className="font-body text-sm text-on-surface-variant/70 mb-8 max-w-3xl">
            A security self-audit from within the running ECS sandbox mapped attack vectors and their mitigations. The architecture applies defense in depth across network, IAM, compute, and storage layers.
          </p>

          {/* Request Flow Architecture Diagram */}
          <div className="mb-8">
            <h3 className="font-label text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-4">Request Flow &amp; Security Layers</h3>
            <div className="overflow-x-auto pb-2">
              <div className="flex items-stretch gap-0 min-w-[720px]">
                <div className="flex-1 rounded-l-lg border border-outline-variant/20 bg-surface-container/30 p-3 text-center">
                  <div className="font-mono text-[10px] text-on-surface-variant/40 mb-1">EXTERNAL</div>
                  <Cloud className="w-5 h-5 text-on-surface-variant/50 mx-auto mb-1" />
                  <div className="font-label text-xs font-semibold text-on-surface">Internet</div>
                  <div className="font-body text-[10px] text-on-surface-variant/50 mt-1">HTTPS only</div>
                </div>
                <div className="flex items-center px-1 text-on-surface-variant/30"><ArrowRight className="w-4 h-4" /></div>
                <div className="flex-1 border border-primary/30 bg-primary/5 p-3 text-center">
                  <div className="font-mono text-[10px] text-primary/60 mb-1">CDN</div>
                  <Monitor className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="font-label text-xs font-semibold text-on-surface">CloudFront</div>
                  <div className="font-body text-[10px] text-on-surface-variant/50 mt-1">Static cache + vault routing</div>
                </div>
                <div className="flex items-center px-1 text-on-surface-variant/30"><ArrowRight className="w-4 h-4" /></div>
                <div className="flex-1 border border-error/30 bg-error/5 p-3 text-center">
                  <div className="font-mono text-[10px] text-error/60 mb-1">AUTH</div>
                  <Lock className="w-5 h-5 text-error mx-auto mb-1" />
                  <div className="font-label text-xs font-semibold text-on-surface">ALB + Cognito</div>
                  <div className="font-body text-[10px] text-on-surface-variant/50 mt-1">GitHub OAuth / 12h sessions</div>
                </div>
                <div className="flex items-center px-1 text-on-surface-variant/30"><ArrowRight className="w-4 h-4" /></div>
                <div className="flex-1 border border-tertiary/30 bg-tertiary/5 p-3 text-center">
                  <div className="font-mono text-[10px] text-tertiary/60 mb-1">COMPUTE</div>
                  <Cpu className="w-5 h-5 text-tertiary mx-auto mb-1" />
                  <div className="font-label text-xs font-semibold text-on-surface">ECS Fargate</div>
                  <div className="font-body text-[10px] text-on-surface-variant/50 mt-1">1 vCPU / 2GB / ARM64</div>
                </div>
                <div className="flex items-center px-1 text-on-surface-variant/30"><ArrowRight className="w-4 h-4" /></div>
                <div className="flex-1 rounded-r-lg border border-accent-success/30 bg-accent-success/5 p-3 text-center">
                  <div className="font-mono text-[10px] text-accent-success/60 mb-1">STORAGE</div>
                  <HardDrive className="w-5 h-5 text-accent-success mx-auto mb-1" />
                  <div className="font-label text-xs font-semibold text-on-surface">EFS Vault</div>
                  <div className="font-body text-[10px] text-on-surface-variant/50 mt-1">AES-256 / per-user / 1GB limit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Controls by Layer */}
          <div className="mb-8">
            <h3 className="font-label text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-4">Security Controls by Layer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Network Isolation */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-4 h-4 text-primary" />
                  <span className="font-label text-sm font-semibold text-on-surface">Network Isolation</span>
                  <span className="ml-auto font-mono text-[10px] bg-accent-success/10 text-accent-success px-2 py-0.5 rounded-full">MITIGATED</span>
                </div>
                <ul className="space-y-1.5 font-body text-xs text-on-surface-variant/60">
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Dedicated sandbox security group replaces shared ECS SG</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Egress restricted to HTTPS (443), DNS (53), NFS (2049) only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Blocks arbitrary outbound ports — prevents reverse shells and C2 channels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>NFS egress scoped to EFS mount targets via security group reference</span>
                  </li>
                </ul>
              </div>

              {/* IAM Hardening */}
              <div className="rounded-lg border border-error/20 bg-error/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-error" />
                  <span className="font-label text-sm font-semibold text-on-surface">IAM Hardening</span>
                  <span className="ml-auto font-mono text-[10px] bg-accent-success/10 text-accent-success px-2 py-0.5 rounded-full">MITIGATED</span>
                </div>
                <ul className="space-y-1.5 font-body text-xs text-on-surface-variant/60">
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Task role limited to EFS mount permission only — least-privilege</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Explicit DENY on 40+ cost-generating actions (ec2:Run*, bedrock:Invoke*, sagemaker:*, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Spawned processes have all AWS credentials stripped from environment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Deploy uses two-tier credential chain with append-only scope</span>
                  </li>
                </ul>
              </div>

              {/* Compute Controls */}
              <div className="rounded-lg border border-tertiary/20 bg-tertiary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-tertiary" />
                  <span className="font-label text-sm font-semibold text-on-surface">Compute Controls</span>
                  <span className="ml-auto font-mono text-[10px] bg-accent-success/10 text-accent-success px-2 py-0.5 rounded-full">MITIGATED</span>
                </div>
                <ul className="space-y-1.5 font-body text-xs text-on-surface-variant/60">
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Fargate enforces 1 vCPU and 2GB memory at platform level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>File descriptor limit: 65,536 (ulimit nofile) prevents fd exhaustion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>All Linux capabilities dropped — no CAP_SYS_ADMIN, no CAP_NET_RAW</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>No Docker socket, no sudo binary, sysfs mounted read-only</span>
                  </li>
                </ul>
              </div>

              {/* Storage Protection */}
              <div className="rounded-lg border border-accent-success/20 bg-accent-success/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="w-4 h-4 text-accent-success" />
                  <span className="font-label text-sm font-semibold text-on-surface">Storage Protection</span>
                  <span className="ml-auto font-mono text-[10px] bg-accent-success/10 text-accent-success px-2 py-0.5 rounded-full">MITIGATED</span>
                </div>
                <ul className="space-y-1.5 font-body text-xs text-on-surface-variant/60">
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Per-user EFS access points with POSIX UID isolation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>Server-side vault size enforcement: 1GB per user on API writes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>CloudWatch alarms on EFS StorageBytes and write throughput spikes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-3 h-3 text-accent-success mt-0.5 flex-shrink-0" />
                    <span>AES-256 encryption at rest, TLS in transit, IAM-enforced mount</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Monitoring & Cost Controls */}
          <div className="mb-8">
            <h3 className="font-label text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-4">Monitoring &amp; Cost Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4 text-center">
                <BarChart3 className="w-5 h-5 text-secondary mx-auto mb-2" />
                <div className="font-label text-xs font-semibold text-on-surface mb-1">CloudWatch Alarms</div>
                <p className="font-body text-[10px] text-on-surface-variant/50">EFS storage size, write throughput spikes, CPU and memory utilization</p>
              </div>
              <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4 text-center">
                <DollarSign className="w-5 h-5 text-tertiary mx-auto mb-2" />
                <div className="font-label text-xs font-semibold text-on-surface mb-1">AWS Budget</div>
                <p className="font-body text-[10px] text-on-surface-variant/50">$100/mo limit with alerts at 50% forecast, 80% actual, 100% actual</p>
              </div>
              <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4 text-center">
                <AlertTriangle className="w-5 h-5 text-error mx-auto mb-2" />
                <div className="font-label text-xs font-semibold text-on-surface mb-1">SNS Notifications</div>
                <p className="font-body text-[10px] text-on-surface-variant/50">Email alerts for all alarm breaches and budget threshold crossings</p>
              </div>
            </div>
          </div>

          {/* Risk Assessment Table */}
          <div>
            <h3 className="font-label text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-4">Risk Assessment</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="font-label text-[10px] text-on-surface-variant/50 uppercase tracking-wider pb-2 pr-4">Attack Vector</th>
                    <th className="font-label text-[10px] text-on-surface-variant/50 uppercase tracking-wider pb-2 pr-4">Severity</th>
                    <th className="font-label text-[10px] text-on-surface-variant/50 uppercase tracking-wider pb-2 pr-4">Status</th>
                    <th className="font-label text-[10px] text-on-surface-variant/50 uppercase tracking-wider pb-2">Mitigation</th>
                  </tr>
                </thead>
                <tbody className="font-body text-xs">
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-2 pr-4 text-on-surface">Container escape to host</td>
                    <td className="py-2 pr-4"><span className="text-error font-semibold">CRITICAL</span></td>
                    <td className="py-2 pr-4"><span className="text-accent-success">Mitigated</span></td>
                    <td className="py-2 text-on-surface-variant/60">Capabilities dropped, no Docker socket, no sudo, Fargate VM isolation</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-2 pr-4 text-on-surface">Privilege escalation</td>
                    <td className="py-2 pr-4"><span className="text-error font-semibold">CRITICAL</span></td>
                    <td className="py-2 pr-4"><span className="text-accent-success">Mitigated</span></td>
                    <td className="py-2 text-on-surface-variant/60">Non-root user (uid 1000), no CAP_SYS_ADMIN, read-only sysfs</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-2 pr-4 text-on-surface">Cross-tenant vault access</td>
                    <td className="py-2 pr-4"><span className="text-error font-semibold">HIGH</span></td>
                    <td className="py-2 pr-4"><span className="text-accent-success">Mitigated</span></td>
                    <td className="py-2 text-on-surface-variant/60">Per-user EFS access points + server-side path traversal validation</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-2 pr-4 text-on-surface">AWS credential abuse</td>
                    <td className="py-2 pr-4"><span className="text-error font-semibold">HIGH</span></td>
                    <td className="py-2 pr-4"><span className="text-accent-success">Mitigated</span></td>
                    <td className="py-2 text-on-surface-variant/60">EFS-only task role + explicit deny on 40+ cost-generating actions</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-2 pr-4 text-on-surface">EFS storage cost abuse</td>
                    <td className="py-2 pr-4"><span className="text-error font-semibold">HIGH</span></td>
                    <td className="py-2 pr-4"><span className="text-accent-success">Mitigated</span></td>
                    <td className="py-2 text-on-surface-variant/60">1GB vault limit + CloudWatch alarms + $100/mo budget alerts</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-2 pr-4 text-on-surface">Data exfiltration</td>
                    <td className="py-2 pr-4"><span className="text-tertiary font-semibold">MEDIUM</span></td>
                    <td className="py-2 pr-4"><span className="text-accent-success">Mitigated</span></td>
                    <td className="py-2 text-on-surface-variant/60">Sandbox SG restricts egress to HTTPS, DNS, NFS ports only</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-on-surface">Compute cost abuse</td>
                    <td className="py-2 pr-4"><span className="text-tertiary font-semibold">MEDIUM</span></td>
                    <td className="py-2 pr-4"><span className="text-accent-success">Mitigated</span></td>
                    <td className="py-2 text-on-surface-variant/60">1 vCPU / 2GB Fargate hard limits + CPU/memory alarms at 90%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-outline-variant/15 mt-6 pt-4">
            <p className="font-body text-xs text-on-surface-variant/40 max-w-2xl">
              Findings sourced from an automated security self-audit executed within the running ECS Fargate sandbox (task family: research-workspace-prod). Infrastructure controls are implemented in Terraform and applied via CI/CD.
            </p>
          </div>
        </section>

        {/* Enterprise Controls — PreToolUse Hooks */}
        <section className="mb-12 rounded-xl border border-tertiary/20 bg-surface-container-low/50 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-tertiary" />
            <h2 className="font-headline text-lg text-on-surface">Enterprise Controls via PreToolUse Hooks</h2>
          </div>
          <p className="font-body text-sm text-on-surface-variant/70 mb-6 max-w-3xl">
            This workspace is a <strong className="text-on-surface">Claude Code native application</strong> — it uses Claude Code's skills, tools, and session management as the core engine for research automation. To make this safe for enterprise deployment, we implement observability and policy enforcement through Claude Code's hook system.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* How it works */}
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface mb-3">How PreToolUse Hooks Work</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-tertiary bg-tertiary/10 rounded px-2 py-1 h-fit">1</span>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Claude Code invokes a tool (Read, Write, Bash, WebFetch, etc.) during a research session
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-tertiary bg-tertiary/10 rounded px-2 py-1 h-fit">2</span>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    <strong className="text-on-surface-variant">Before execution</strong>, the PreToolUse hook fires — a shell script receives the tool name and input as JSON on stdin
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-tertiary bg-tertiary/10 rounded px-2 py-1 h-fit">3</span>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    The hook checks against a configurable <code className="text-tertiary bg-tertiary/5 px-1 rounded">tool-policy.json</code> — if the tool is blocked, it returns <code className="text-error bg-error/5 px-1 rounded">{'"decision":"block"'}</code> and Claude skips it
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-tertiary bg-tertiary/10 rounded px-2 py-1 h-fit">4</span>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Every invocation is logged to a per-user activity file with timestamp, tool, input, and decision — visible in real-time in the workspace's <strong className="text-on-surface-variant">Hooks & Activity</strong> panel
                  </p>
                </div>
              </div>
            </div>

            {/* Why it matters */}
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface mb-3">Why This Matters for Enterprise</h3>
              <div className="space-y-2">
                <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-3">
                  <p className="font-label text-xs font-semibold text-on-surface mb-1">Full Observability</p>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Every action the AI agent takes is audited before it happens. Compliance teams can review what tools were used, what files were accessed, and what commands were executed — per user, per session.
                  </p>
                </div>
                <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-3">
                  <p className="font-label text-xs font-semibold text-on-surface mb-1">Configurable Policy Enforcement</p>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Admins can create per-user or organization-wide tool policies. Block shell access for read-only analysts, restrict file writes for reviewers, or deny network access entirely — all through a JSON config, no code changes.
                  </p>
                </div>
                <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-3">
                  <p className="font-label text-xs font-semibold text-on-surface mb-1">Native Integration, Not a Wrapper</p>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Unlike API-level guardrails that only see prompts and responses, PreToolUse hooks intercept at the <em>action</em> layer — the moment Claude decides to use a tool. This is the same mechanism available to any Claude Code native application.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant/15 pt-4">
            <p className="font-body text-xs text-on-surface-variant/40 max-w-2xl">
              This pattern — Claude Code as an application engine with hooks for governance — applies to any domain: code review pipelines, document generation, data analysis, customer support automation. The hooks are the control plane; the skills and tools are the data plane.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
