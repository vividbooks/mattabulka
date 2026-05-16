import type { SupabaseClient } from '@supabase/supabase-js';
import type { BoardDocumentV1 } from './boardDocument';
import type { TaskAssignmentSettings } from './taskAssignments';

export type BoardTaskScoreExample = {
  exampleId: string;
  index: number;
  kind: 'arithmetic' | 'sequence' | 'domino' | 'marbleBag';
  correct: boolean;
  answer: unknown;
  expected: unknown;
};

export type BoardTaskScore = {
  correct: number;
  total: number;
  percent: number;
  examples: BoardTaskScoreExample[];
};

export type BoardTaskShareRow = {
  id: string;
  owner_id: string;
  board_file_id: string | null;
  token: string;
  title: string;
  document: BoardDocumentV1;
  task_kind: 'arithmetic' | 'sequence' | 'domino' | 'marbleBag' | 'mixed';
  task_settings: TaskAssignmentSettings | null;
  assignment_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BoardTaskSubmissionRow = {
  id: string;
  task_share_id: string;
  student_name: string;
  document: BoardDocumentV1;
  score: BoardTaskScore;
  created_at: string;
};

function shareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function boardTaskShareUrl(token: string) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#task-share=${encodeURIComponent(token)}`;
}

export async function createBoardTaskShare(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    boardFileId?: string | null;
    title: string;
    document: BoardDocumentV1;
    taskKind: BoardTaskShareRow['task_kind'];
    taskSettings?: TaskAssignmentSettings | null;
    assignmentId?: string | null;
  },
): Promise<{ ok: true; share: BoardTaskShareRow } | { ok: false; error: string }> {
  const row = {
    owner_id: input.ownerId,
    board_file_id: input.boardFileId ?? null,
    token: shareToken(),
    title: input.title.trim() || 'Úkol',
    document: input.document,
    task_kind: input.taskKind,
    task_settings: input.taskSettings ?? null,
    assignment_id: input.assignmentId ?? null,
  };
  const { data, error } = await supabase
    .from('board_task_shares')
    .insert(row)
    .select('id,owner_id,board_file_id,token,title,document,task_kind,task_settings,assignment_id,is_active,created_at,updated_at')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Zadání úkolu se nepodařilo vytvořit.' };
  return { ok: true, share: data as BoardTaskShareRow };
}

export async function getBoardTaskShareByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<{ ok: true; share: BoardTaskShareRow } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('board_task_shares')
    .select('id,owner_id,board_file_id,token,title,document,task_kind,task_settings,assignment_id,is_active,created_at,updated_at')
    .eq('token', token)
    .eq('is_active', true)
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Zadaný úkol se nepodařilo načíst.' };
  return { ok: true, share: data as BoardTaskShareRow };
}

export async function listBoardTaskSharesForFile(
  supabase: SupabaseClient,
  boardFileId: string,
): Promise<{ ok: true; shares: BoardTaskShareRow[] } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('board_task_shares')
    .select('id,owner_id,board_file_id,token,title,document,task_kind,task_settings,assignment_id,is_active,created_at,updated_at')
    .eq('board_file_id', boardFileId)
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, shares: (data ?? []) as BoardTaskShareRow[] };
}

export async function listBoardTaskSubmissions(
  supabase: SupabaseClient,
  taskShareId: string,
): Promise<{ ok: true; submissions: BoardTaskSubmissionRow[] } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('board_task_submissions')
    .select('id,task_share_id,student_name,document,score,created_at')
    .eq('task_share_id', taskShareId)
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, submissions: (data ?? []) as BoardTaskSubmissionRow[] };
}

export async function submitBoardTask(
  supabase: SupabaseClient,
  input: {
    taskShareId: string;
    studentName: string;
    document: BoardDocumentV1;
    score: BoardTaskScore;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from('board_task_submissions').insert({
    task_share_id: input.taskShareId,
    student_name: input.studentName.trim(),
    document: input.document,
    score: input.score,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
