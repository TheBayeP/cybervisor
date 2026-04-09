'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui';
import { CheckCircle, XCircle, AlertTriangle, MinusCircle, ChevronDown, ShieldCheck, RefreshCw, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ComplianceStatus = 'compliant' | 'in_progress' | 'non_compliant' | 'not_evaluated';

interface ComplianceItem {
  id: string;
  framework: string;
  section: string;
  control: string;
  description_fr: string;
  description_en: string;
  status: ComplianceStatus;
}

interface FrameworkConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  sections: { id: string; title_fr: string; title_en: string; controls: Omit<ComplianceItem, 'status' | 'framework'>[] }[];
}

// ---------------------------------------------------------------------------
// Predefined frameworks
// ---------------------------------------------------------------------------

const FRAMEWORKS: FrameworkConfig[] = [
  {
    id: 'nis2',
    name: 'NIS2',
    icon: '🇪🇺',
    color: 'blue',
    sections: [
      {
        id: 'governance', title_fr: 'Gouvernance', title_en: 'Governance',
        controls: [
          { id: 'nis2-gov-1', section: 'governance', control: 'Politique de sécurité / Security Policy', description_fr: 'Définir et maintenir une politique de sécurité des SI', description_en: 'Define and maintain an IS security policy' },
          { id: 'nis2-gov-2', section: 'governance', control: 'Responsabilité direction / Board responsibility', description_fr: 'Implication de la direction dans la cybersécurité', description_en: 'Board involvement in cybersecurity' },
          { id: 'nis2-gov-3', section: 'governance', control: 'Formation cyber / Cyber training', description_fr: 'Programme de formation et sensibilisation', description_en: 'Training and awareness program' },
          { id: 'nis2-gov-4', section: 'governance', control: 'Gestion des risques / Risk management', description_fr: 'Processus de gestion des risques cyber', description_en: 'Cyber risk management process' },
        ]
      },
      {
        id: 'incident', title_fr: 'Gestion des incidents', title_en: 'Incident management',
        controls: [
          { id: 'nis2-inc-1', section: 'incident', control: 'Détection / Detection', description_fr: 'Capacités de détection des incidents', description_en: 'Incident detection capabilities' },
          { id: 'nis2-inc-2', section: 'incident', control: 'Notification / Notification', description_fr: 'Notification dans les 24h aux autorités', description_en: 'Notification to authorities within 24h' },
          { id: 'nis2-inc-3', section: 'incident', control: 'Réponse / Response', description_fr: 'Plan de réponse aux incidents', description_en: 'Incident response plan' },
          { id: 'nis2-inc-4', section: 'incident', control: 'Rapport final / Final report', description_fr: 'Rapport détaillé sous 1 mois', description_en: 'Detailed report within 1 month' },
        ]
      },
      {
        id: 'supply-chain', title_fr: 'Chaîne d\'approvisionnement', title_en: 'Supply chain',
        controls: [
          { id: 'nis2-sc-1', section: 'supply-chain', control: 'Évaluation fournisseurs / Vendor assessment', description_fr: 'Évaluation sécurité des fournisseurs', description_en: 'Security assessment of suppliers' },
          { id: 'nis2-sc-2', section: 'supply-chain', control: 'Clauses contractuelles / Contractual clauses', description_fr: 'Clauses de sécurité dans les contrats', description_en: 'Security clauses in contracts' },
        ]
      },
      {
        id: 'continuity', title_fr: 'Continuité d\'activité', title_en: 'Business continuity',
        controls: [
          { id: 'nis2-bc-1', section: 'continuity', control: 'PCA/PRA', description_fr: 'Plan de continuité et reprise d\'activité', description_en: 'Business continuity and recovery plan' },
          { id: 'nis2-bc-2', section: 'continuity', control: 'Sauvegardes / Backups', description_fr: 'Politique de sauvegarde et tests de restauration', description_en: 'Backup policy and restore tests' },
          { id: 'nis2-bc-3', section: 'continuity', control: 'Chiffrement / Encryption', description_fr: 'Utilisation du chiffrement pour les données sensibles', description_en: 'Use of encryption for sensitive data' },
        ]
      },
    ],
  },
  {
    id: 'rgpd',
    name: 'RGPD / GDPR',
    icon: '🔒',
    color: 'purple',
    sections: [
      {
        id: 'rights', title_fr: 'Droits des personnes', title_en: 'Individual rights',
        controls: [
          { id: 'rgpd-r-1', section: 'rights', control: 'Consentement / Consent', description_fr: 'Recueil et gestion du consentement', description_en: 'Consent collection and management' },
          { id: 'rgpd-r-2', section: 'rights', control: 'Droit d\'accès / Right of access', description_fr: 'Procédure de réponse aux demandes d\'accès', description_en: 'Procedure for access requests' },
          { id: 'rgpd-r-3', section: 'rights', control: 'Droit à l\'effacement / Right to erasure', description_fr: 'Capacité de suppression des données personnelles', description_en: 'Ability to delete personal data' },
          { id: 'rgpd-r-4', section: 'rights', control: 'Portabilité / Portability', description_fr: 'Export des données dans un format standard', description_en: 'Data export in standard format' },
        ]
      },
      {
        id: 'data-protection', title_fr: 'Protection des données', title_en: 'Data protection',
        controls: [
          { id: 'rgpd-dp-1', section: 'data-protection', control: 'DPO / DPO', description_fr: 'Désignation d\'un Délégué à la Protection des Données', description_en: 'Appointment of a Data Protection Officer' },
          { id: 'rgpd-dp-2', section: 'data-protection', control: 'Registre des traitements / Processing register', description_fr: 'Registre à jour des traitements de données', description_en: 'Up-to-date data processing register' },
          { id: 'rgpd-dp-3', section: 'data-protection', control: 'AIPD / DPIA', description_fr: 'Analyses d\'impact sur la protection des données', description_en: 'Data Protection Impact Assessments' },
          { id: 'rgpd-dp-4', section: 'data-protection', control: 'Violation de données / Data breach', description_fr: 'Notification CNIL sous 72h en cas de violation', description_en: 'CNIL notification within 72h in case of breach' },
        ]
      },
      {
        id: 'transfers', title_fr: 'Transferts', title_en: 'Transfers',
        controls: [
          { id: 'rgpd-t-1', section: 'transfers', control: 'Transferts hors UE / Non-EU transfers', description_fr: 'Encadrement des transferts hors espace économique européen', description_en: 'Framework for transfers outside the EEA' },
          { id: 'rgpd-t-2', section: 'transfers', control: 'Sous-traitants / Processors', description_fr: 'Contrats et contrôle des sous-traitants', description_en: 'Processor contracts and oversight' },
        ]
      },
    ],
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    icon: '🏅',
    color: 'green',
    sections: [
      {
        id: 'organizational', title_fr: 'Mesures organisationnelles', title_en: 'Organizational controls',
        controls: [
          { id: 'iso-o-1', section: 'organizational', control: 'A.5 Politiques / Policies', description_fr: 'Politiques de sécurité de l\'information', description_en: 'Information security policies' },
          { id: 'iso-o-2', section: 'organizational', control: 'A.6 Organisation / Organization', description_fr: 'Organisation de la sécurité', description_en: 'Organization of security' },
          { id: 'iso-o-3', section: 'organizational', control: 'A.7 RH / HR', description_fr: 'Sécurité liée aux ressources humaines', description_en: 'HR-related security' },
          { id: 'iso-o-4', section: 'organizational', control: 'A.8 Actifs / Assets', description_fr: 'Gestion des actifs informationnels', description_en: 'Information asset management' },
        ]
      },
      {
        id: 'technical', title_fr: 'Mesures techniques', title_en: 'Technical controls',
        controls: [
          { id: 'iso-t-1', section: 'technical', control: 'A.9 Accès / Access', description_fr: 'Contrôle d\'accès et authentification', description_en: 'Access control and authentication' },
          { id: 'iso-t-2', section: 'technical', control: 'A.10 Chiffrement / Cryptography', description_fr: 'Mesures cryptographiques', description_en: 'Cryptographic measures' },
          { id: 'iso-t-3', section: 'technical', control: 'A.12 Opérations / Operations', description_fr: 'Sécurité opérationnelle', description_en: 'Operational security' },
          { id: 'iso-t-4', section: 'technical', control: 'A.13 Réseaux / Networks', description_fr: 'Sécurité des communications', description_en: 'Communications security' },
          { id: 'iso-t-5', section: 'technical', control: 'A.14 Développement / Development', description_fr: 'Sécurité dans le développement', description_en: 'Security in development' },
        ]
      },
      {
        id: 'management', title_fr: 'Management', title_en: 'Management',
        controls: [
          { id: 'iso-m-1', section: 'management', control: 'A.15 Fournisseurs / Suppliers', description_fr: 'Relations avec les fournisseurs', description_en: 'Supplier relationships' },
          { id: 'iso-m-2', section: 'management', control: 'A.16 Incidents / Incidents', description_fr: 'Gestion des incidents de sécurité', description_en: 'Security incident management' },
          { id: 'iso-m-3', section: 'management', control: 'A.17 Continuité / Continuity', description_fr: 'Continuité de la sécurité', description_en: 'Security continuity' },
          { id: 'iso-m-4', section: 'management', control: 'A.18 Conformité / Compliance', description_fr: 'Conformité légale et réglementaire', description_en: 'Legal and regulatory compliance' },
        ]
      },
    ],
  },
  {
    id: 'anssi',
    name: 'ANSSI Hygiène',
    icon: '🇫🇷',
    color: 'indigo',
    sections: [
      {
        id: 'sensibilisation', title_fr: 'Sensibilisation', title_en: 'Awareness',
        controls: [
          { id: 'anssi-s-1', section: 'sensibilisation', control: 'Charte informatique / IT charter', description_fr: 'Charte d\'utilisation des moyens informatiques', description_en: 'IT usage charter' },
          { id: 'anssi-s-2', section: 'sensibilisation', control: 'Sensibilisation / Awareness', description_fr: 'Sensibilisation régulière des utilisateurs', description_en: 'Regular user awareness training' },
        ]
      },
      {
        id: 'authentification', title_fr: 'Authentification', title_en: 'Authentication',
        controls: [
          { id: 'anssi-a-1', section: 'authentification', control: 'MFA', description_fr: 'Authentification multifacteur', description_en: 'Multi-factor authentication' },
          { id: 'anssi-a-2', section: 'authentification', control: 'Mots de passe / Passwords', description_fr: 'Politique de mots de passe robuste', description_en: 'Strong password policy' },
          { id: 'anssi-a-3', section: 'authentification', control: 'Comptes admin / Admin accounts', description_fr: 'Gestion des comptes à privilèges', description_en: 'Privileged account management' },
        ]
      },
      {
        id: 'mises-a-jour', title_fr: 'Mises à jour', title_en: 'Updates',
        controls: [
          { id: 'anssi-u-1', section: 'mises-a-jour', control: 'Patch management', description_fr: 'Politique de gestion des correctifs', description_en: 'Patch management policy' },
          { id: 'anssi-u-2', section: 'mises-a-jour', control: 'Inventaire logiciel / Software inventory', description_fr: 'Inventaire à jour des logiciels déployés', description_en: 'Up-to-date deployed software inventory' },
        ]
      },
      {
        id: 'sauvegarde', title_fr: 'Sauvegarde', title_en: 'Backup',
        controls: [
          { id: 'anssi-b-1', section: 'sauvegarde', control: 'Règle 3-2-1', description_fr: '3 copies, 2 supports, 1 hors site', description_en: '3 copies, 2 media, 1 offsite' },
          { id: 'anssi-b-2', section: 'sauvegarde', control: 'Tests de restauration / Restore tests', description_fr: 'Tests réguliers de restauration', description_en: 'Regular restore testing' },
        ]
      },
      {
        id: 'reseau', title_fr: 'Réseau', title_en: 'Network',
        controls: [
          { id: 'anssi-n-1', section: 'reseau', control: 'Pare-feu / Firewall', description_fr: 'Filtrage réseau et pare-feu', description_en: 'Network filtering and firewall' },
          { id: 'anssi-n-2', section: 'reseau', control: 'Segmentation', description_fr: 'Segmentation du réseau', description_en: 'Network segmentation' },
          { id: 'anssi-n-3', section: 'reseau', control: 'VPN', description_fr: 'Accès distant sécurisé', description_en: 'Secure remote access' },
          { id: 'anssi-n-4', section: 'reseau', control: 'Wifi sécurisé / Secure WiFi', description_fr: 'Sécurisation des réseaux sans fil', description_en: 'Wireless network security' },
        ]
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<ComplianceStatus, { label_fr: string; label_en: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  compliant: { label_fr: 'Conforme', label_en: 'Compliant', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  in_progress: { label_fr: 'En cours', label_en: 'In progress', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  non_compliant: { label_fr: 'Non conforme', label_en: 'Non-compliant', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  not_evaluated: { label_fr: 'Non évalué', label_en: 'Not evaluated', icon: MinusCircle, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
};

const STATUS_ORDER: ComplianceStatus[] = ['not_evaluated', 'non_compliant', 'in_progress', 'compliant'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  const { lang } = useLanguage();
  const [activeFramework, setActiveFramework] = useState(FRAMEWORKS[0].id);
  const [statuses, setStatuses] = useState<Record<string, ComplianceStatus>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load statuses from API
  const loadStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/compliance');
      const data = await res.json();
      const map: Record<string, ComplianceStatus> = {};
      for (const item of data.items || []) {
        map[item.control_id] = item.status;
      }
      setStatuses(map);
    } catch (e) {
      console.error('Failed to load compliance:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);

  // Expand all sections on framework change
  useEffect(() => {
    const fw = FRAMEWORKS.find(f => f.id === activeFramework);
    if (fw) {
      setExpandedSections(new Set(fw.sections.map(s => s.id)));
    }
  }, [activeFramework]);

  const updateStatus = async (controlId: string, framework: string, status: ComplianceStatus) => {
    setStatuses(prev => ({ ...prev, [controlId]: status }));
    try {
      await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ control_id: controlId, framework, status }),
      });
    } catch (e) {
      console.error('Failed to save compliance status:', e);
    }
  };

  const cycleStatus = (controlId: string, framework: string) => {
    const current = statuses[controlId] || 'not_evaluated';
    const idx = STATUS_ORDER.indexOf(current);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    updateStatus(controlId, framework, next);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const fw = FRAMEWORKS.find(f => f.id === activeFramework)!;

  // Stats
  const allControls = fw.sections.flatMap(s => s.controls);
  const totalControls = allControls.length;
  const compliantCount = allControls.filter(c => statuses[c.id] === 'compliant').length;
  const inProgressCount = allControls.filter(c => statuses[c.id] === 'in_progress').length;
  const nonCompliantCount = allControls.filter(c => statuses[c.id] === 'non_compliant').length;
  const notEvaluatedCount = totalControls - compliantCount - inProgressCount - nonCompliantCount;
  const score = totalControls > 0 ? Math.round((compliantCount / totalControls) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {lang === 'fr' ? 'Conformité' : 'Compliance'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {lang === 'fr' ? 'Suivi de conformité aux référentiels cybersécurité' : 'Cybersecurity framework compliance tracking'}
        </p>
      </div>

      {/* Framework tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FRAMEWORKS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFramework(f.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              activeFramework === f.id
                ? 'bg-cyber-500 text-white shadow-lg shadow-cyber-500/25'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            )}
          >
            <span>{f.icon}</span>
            {f.name}
          </button>
        ))}
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col items-center justify-center">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="3" />
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-cyber-500" strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{score}%</span>
            </div>
          </div>
          <span className="text-xs text-gray-500 mt-2">{lang === 'fr' ? 'Score global' : 'Overall score'}</span>
        </div>
        {([
          { key: 'compliant', count: compliantCount },
          { key: 'in_progress', count: inProgressCount },
          { key: 'non_compliant', count: nonCompliantCount },
          { key: 'not_evaluated', count: notEvaluatedCount },
        ] as { key: ComplianceStatus; count: number }[]).map(({ key, count }) => {
          const cfg = STATUS_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <div key={key} className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4')}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('w-4 h-4', cfg.color)} />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {lang === 'fr' ? cfg.label_fr : cfg.label_en}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
              <div className="text-xs text-gray-400">/ {totalControls}</div>
            </div>
          );
        })}
      </div>

      {/* Sections */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {fw.sections.map(section => {
            const isExpanded = expandedSections.has(section.id);
            const sectionCompliant = section.controls.filter(c => statuses[c.id] === 'compliant').length;
            const sectionTotal = section.controls.length;

            return (
              <div key={section.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {lang === 'fr' ? section.title_fr : section.title_en}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      {sectionCompliant}/{sectionTotal}
                    </span>
                  </div>
                  <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800">
                    {section.controls.map(control => {
                      const status = statuses[control.id] || 'not_evaluated';
                      const cfg = STATUS_CONFIG[status];
                      const Icon = cfg.icon;

                      return (
                        <div
                          key={control.id}
                          className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0 border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <button
                            onClick={() => cycleStatus(control.id, fw.id)}
                            className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all', cfg.bg)}
                            title={lang === 'fr' ? 'Cliquez pour changer le statut' : 'Click to change status'}
                          >
                            <Icon className={cn('w-5 h-5', cfg.color)} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{control.control}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {lang === 'fr' ? control.description_fr : control.description_en}
                            </div>
                          </div>
                          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', cfg.bg, cfg.color)}>
                            {lang === 'fr' ? cfg.label_fr : cfg.label_en}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
