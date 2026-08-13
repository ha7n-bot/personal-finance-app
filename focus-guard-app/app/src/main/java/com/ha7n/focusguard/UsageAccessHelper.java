package com.ha7n.focusguard;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.os.Process;

import java.time.LocalDate;
import java.time.ZoneId;

public final class UsageAccessHelper {
    private UsageAccessHelper() {}

    public static boolean hasUsageAccess(Context context) {
        AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    public static long getTodayUsageMillis(Context context, String packageName) {
        if (!hasUsageAccess(context)) return 0L;

        long now = System.currentTimeMillis();
        long start = LocalDate.now()
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();

        UsageStatsManager manager = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
        UsageEvents events = manager.queryEvents(start, now);
        UsageEvents.Event event = new UsageEvents.Event();

        long total = 0L;
        long activeSince = -1L;

        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            if (!packageName.equals(event.getPackageName())) continue;

            int type = event.getEventType();
            boolean resumed = type == UsageEvents.Event.ACTIVITY_RESUMED
                    || type == UsageEvents.Event.MOVE_TO_FOREGROUND;
            boolean paused = type == UsageEvents.Event.ACTIVITY_PAUSED
                    || type == UsageEvents.Event.MOVE_TO_BACKGROUND;

            if (resumed) {
                if (activeSince < 0L) activeSince = Math.max(start, event.getTimeStamp());
            } else if (paused && activeSince >= 0L) {
                total += Math.max(0L, event.getTimeStamp() - activeSince);
                activeSince = -1L;
            }
        }

        if (activeSince >= 0L) total += Math.max(0L, now - activeSince);
        return total;
    }

    public static String formatMinutes(long millis) {
        long totalMinutes = Math.max(0L, millis / 60000L);
        long hours = totalMinutes / 60L;
        long minutes = totalMinutes % 60L;
        if (hours > 0) return hours + " س " + minutes + " د";
        return minutes + " د";
    }
}
