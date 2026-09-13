export type Stage = 'land' | 'foundation' | 'frame' | 'cottage' | 'townhouse' | 'decorated';
export interface Rule { version: string; mode: 'weighted' | 'commits' | 'stars' | 'custom'; weights: { commits: number; stars: number; forks: number }; thresholds: number[] }
export interface Project { id: string; name: string; repository: string; description: string; homepage?: string; color: string; plot: { x: number; z: number }; builder: { name: string; bio?: string; url?: string; avatar?: string; followers?: number; locationText?: string; location?: {label:string;lat:number;lon:number;source:'github'|'manual'} } }
export type Landscape = 'flat' | 'valley' | 'clouds';
export interface SupportConfiguration { version: 1; chainId: 11155111; recipient?: string; projectRecipients?: Record<string, string> }
export interface TownEvent { landscape?: Landscape; schemaVersion: number; id: string; name: string; subtitle: string; url: string; sampleData: boolean; collectionType?: 'personal' | 'hackathon'; mode: 'static' | 'live'; refreshSeconds: number; rule: Rule; projects: Project[]; support?: SupportConfiguration; customScores?: Record<string, number>; residentMap?: {enabled:boolean;fetchProfiles:boolean}; deployment?: {slug:string;createdAt:string} }
export interface RecordState { projectId: string; plot: { x: number; z: number }; status: 'baseline' | 'fresh' | 'stale' | 'unknown'; observedAt: string | null; metrics: { commits: number; stars: number; forks: number; headOid?: string; reference?: string } | null; score: number | null; stage: Stage | null; rule: Rule | null }
export interface Snapshot { id: string; kind?: 'baseline' | 'capture'; label: string; capturedAt: string; projects: RecordState[] }
export interface History { schemaVersion: number; eventId: string; sampleData: boolean; snapshots: Snapshot[] }
export interface Bundle { format: string; event: TownEvent; history: History }
