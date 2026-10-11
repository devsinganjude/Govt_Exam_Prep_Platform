export const INTERVALS_DAYS = [1, 3, 7, 21, 45];

export function getNextRevisionData(currentRevisionStage: number | null): {
  revision_stage: number;
  next_revision_at: Date;
} {
  const stage = currentRevisionStage === null ? 0 : Math.min(currentRevisionStage + 1, INTERVALS_DAYS.length - 1);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + INTERVALS_DAYS[stage]);
  
  return {
    revision_stage: stage,
    next_revision_at: nextDate,
  };
}

export function getInitialRevisionData(): {
  revision_stage: number;
  next_revision_at: Date;
} {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + INTERVALS_DAYS[0]);
  
  return {
    revision_stage: 0,
    next_revision_at: nextDate,
  };
}
