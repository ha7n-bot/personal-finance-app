package com.ha7n.mali;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.util.Calendar;

public final class ReminderScheduler {
    private static final String PREFS = "mali_reminder_preferences";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_FREQUENCY = "frequency";
    private static final String KEY_HOUR = "hour";
    private static final String KEY_MINUTE = "minute";
    private static final String KEY_DAY = "day_of_month";
    private static final int REQUEST_CODE = 220;

    private ReminderScheduler() {}

    public static void saveAndSchedule(Context context, String frequency, int hour, int minute) {
        String safeFrequency = isSupported(frequency) ? frequency : "daily";
        int safeHour = Math.max(0, Math.min(23, hour));
        int safeMinute = Math.max(0, Math.min(59, minute));
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putBoolean(KEY_ENABLED, true)
                .putString(KEY_FREQUENCY, safeFrequency)
                .putInt(KEY_HOUR, safeHour)
                .putInt(KEY_MINUTE, safeMinute)
                .putInt(KEY_DAY, Calendar.getInstance().get(Calendar.DAY_OF_MONTH))
                .apply();
        scheduleNext(context);
    }

    public static void scheduleNext(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!preferences.getBoolean(KEY_ENABLED, false)) return;
        String frequency = preferences.getString(KEY_FREQUENCY, "daily");
        int hour = preferences.getInt(KEY_HOUR, 20);
        int minute = preferences.getInt(KEY_MINUTE, 0);
        int dayOfMonth = preferences.getInt(KEY_DAY, Calendar.getInstance().get(Calendar.DAY_OF_MONTH));

        Calendar now = Calendar.getInstance();
        Calendar next = Calendar.getInstance();
        next.set(Calendar.HOUR_OF_DAY, hour);
        next.set(Calendar.MINUTE, minute);
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);

        if ("monthly".equals(frequency)) {
            next.set(Calendar.DAY_OF_MONTH, Math.min(dayOfMonth, next.getActualMaximum(Calendar.DAY_OF_MONTH)));
            if (!next.after(now)) {
                next.add(Calendar.MONTH, 1);
                next.set(Calendar.DAY_OF_MONTH, Math.min(dayOfMonth, next.getActualMaximum(Calendar.DAY_OF_MONTH)));
            }
        } else if (!next.after(now)) {
            next.add(Calendar.DAY_OF_YEAR, "weekly".equals(frequency) ? 7 : "biweekly".equals(frequency) ? 14 : 1);
        }

        Intent intent = new Intent(context, FinancialReminderReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager != null) manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pendingIntent);
    }

    public static void cancel(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_ENABLED, false).apply();
        Intent intent = new Intent(context, FinancialReminderReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, REQUEST_CODE, intent, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager != null && pendingIntent != null) manager.cancel(pendingIntent);
        if (pendingIntent != null) pendingIntent.cancel();
    }

    public static boolean isEnabled(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, false);
    }

    private static boolean isSupported(String frequency) {
        return "daily".equals(frequency) || "weekly".equals(frequency) || "biweekly".equals(frequency) || "monthly".equals(frequency);
    }
}
