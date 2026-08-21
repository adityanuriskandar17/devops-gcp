// Curated metadata for the home "pilih materi" grid.
// Keyed by the folder name exactly as it appears in the file tree.
// Any folder not listed here (e.g. internal notes unrelated to the
// DevOps/GCP curriculum) simply won't get a card — it's still reachable
// from the sidebar as before.

export const CATEGORIES = {
  fundamental: { label: 'Fundamental', chip: 'FUNDAMENTAL' },
  gcp: { label: 'Google Cloud', chip: 'GOOGLE CLOUD' },
  praktik: { label: 'Praktik', chip: 'PRAKTIK' },
  studikasus: { label: 'Studi Kasus', chip: 'STUDI KASUS' },
};

export const TOPICS = [
  {
    folder: 'Linux-Fundamentals',
    icon: 'terminal',
    category: 'fundamental',
    description: 'Kernel, distro, filesystem, permission, process, dan package management.',
  },
  {
    folder: 'Bash-Scripting',
    icon: 'shebang',
    category: 'fundamental',
    description: 'Shell scripting untuk automation — variable, control flow, function, text processing.',
  },
  {
    folder: 'Git-VCS',
    icon: 'branch',
    category: 'fundamental',
    description: 'Version control — branching, merging, remote collaboration, GitHub/GitLab.',
  },
  {
    folder: 'Networking-Protocols',
    icon: 'globe',
    category: 'fundamental',
    description: 'OSI/TCP-IP, DNS, HTTP/TLS, proxy, load balancer, firewall, SSH, email.',
  },
  {
    folder: 'Docker-Containers',
    icon: 'crate',
    category: 'fundamental',
    description: 'Image, Dockerfile, registry, networking/volume, Docker Compose.',
  },
  {
    folder: 'Compute-Engine',
    icon: 'server',
    category: 'gcp',
    description: 'VM instance, machine type, disk & snapshot, networking, monitoring.',
  },
  {
    folder: 'IAM',
    icon: 'shield-key',
    category: 'gcp',
    description: 'Identity & access management — role, service account, audit.',
  },
  {
    folder: 'Cloud-Storage',
    icon: 'bucket',
    category: 'gcp',
    description: 'Storage class, Autoclass, lifecycle, access control, pricing.',
  },
  {
    folder: 'Cloud-SQL',
    icon: 'database',
    category: 'gcp',
    description: 'MySQL/PostgreSQL/SQL Server — create, HA, backup, migration.',
  },
  {
    folder: 'Cloud-CDN',
    icon: 'cdn',
    category: 'gcp',
    description: 'Cloud CDN, Media CDN, caching, security, integrasi storage.',
  },
  {
    folder: 'Cloud-Armor',
    icon: 'shield-check',
    category: 'gcp',
    description: 'WAF, DDoS protection, rate limiting, adaptive protection.',
  },
  {
    folder: 'Cloud-KMS',
    icon: 'key',
    category: 'gcp',
    description: 'Key management — key ring, rotation, CMEK, HSM.',
  },
  {
    folder: 'GKE',
    icon: 'cluster',
    category: 'gcp',
    description: 'Kubernetes Engine — cluster, workload, scaling, security.',
  },
  {
    folder: 'Cloud-Monitoring',
    icon: 'chart',
    category: 'gcp',
    description: 'Monitoring, logging, dashboard, alerting, uptime checks.',
  },
  {
    folder: 'Tutorial-GCE',
    icon: 'checklist',
    category: 'praktik',
    description: 'Hands-on: create VM, install Nginx, MariaDB, setup domain & HTTPS.',
  },
  {
    folder: 'GCP-error',
    icon: 'warning',
    category: 'studikasus',
    description: 'Catatan insiden nyata dan cara mendiagnosisnya di lapangan.',
  },
];
