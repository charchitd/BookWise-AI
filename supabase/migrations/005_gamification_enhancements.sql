-- Add gamification columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_goal_minutes int NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS xp_points int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak_days int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Level function: 10 tiers based on XP
CREATE OR REPLACE FUNCTION get_user_level(xp int)
RETURNS int AS $$
BEGIN
  IF xp < 100   THEN RETURN 1;
  ELSIF xp < 300   THEN RETURN 2;
  ELSIF xp < 600   THEN RETURN 3;
  ELSIF xp < 1000  THEN RETURN 4;
  ELSIF xp < 1600  THEN RETURN 5;
  ELSIF xp < 2500  THEN RETURN 6;
  ELSIF xp < 4000  THEN RETURN 7;
  ELSIF xp < 6000  THEN RETURN 8;
  ELSIF xp < 9000  THEN RETURN 9;
  ELSE RETURN 10;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enhanced increment: tracks XP (2pts/min) and consecutive-day streak
CREATE OR REPLACE FUNCTION increment_learning_minutes(user_uuid uuid, minutes_to_add int)
RETURNS jsonb AS $$
DECLARE
  p           record;
  today_date  date := CURRENT_DATE;
  xp_earned   int  := minutes_to_add * 2;
  new_streak  int;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = user_uuid;

  IF NOT FOUND THEN
    INSERT INTO public.profiles
      (id, display_name, total_learning_minutes, xp_points, current_streak_days, last_active_date)
    VALUES
      (user_uuid, 'Scholar_' || substr(user_uuid::text, 1, 6),
       minutes_to_add, xp_earned, 1, today_date);
    RETURN jsonb_build_object('xp_earned', xp_earned, 'streak', 1, 'total_xp', xp_earned);
  END IF;

  -- Streak logic
  IF p.last_active_date IS NULL OR p.last_active_date < today_date - 1 THEN
    new_streak := 1;                                -- broken or first time
  ELSIF p.last_active_date = today_date - 1 THEN
    new_streak := p.current_streak_days + 1;        -- consecutive day
  ELSE
    new_streak := p.current_streak_days;            -- already active today
  END IF;

  UPDATE public.profiles SET
    total_learning_minutes = total_learning_minutes + minutes_to_add,
    xp_points              = xp_points + xp_earned,
    current_streak_days    = new_streak,
    last_active_date       = today_date
  WHERE id = user_uuid;

  RETURN jsonb_build_object(
    'xp_earned', xp_earned,
    'streak',    new_streak,
    'total_xp',  p.xp_points + xp_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
