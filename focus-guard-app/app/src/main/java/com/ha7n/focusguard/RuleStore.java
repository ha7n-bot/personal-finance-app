package com.ha7n.focusguard;

import android.content.Context;
import android.content.SharedPreferences;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public final class RuleStore {
    private static final String PREFS = "focus_guard_rules";
    private static final String LIMIT_PREFIX = "limit:";
    private static final String LABEL_PREFIX = "label:";
    private static final String LOCKED_UNTIL_DAY = "settings_locked_until_epoch_day";

    private RuleStore() {}

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static int getLimitMinutes(Context context, String packageName) {
        return prefs(context).getInt(LIMIT_PREFIX + packageName, 0);
    }

    public static String getLabel(Context context, String packageName) {
        return prefs(context).getString(LABEL_PREFIX + packageName, packageName);
    }

    public static void setRule(Context context, String packageName, String label, int limitMinutes) {
        prefs(context).edit()
                .putInt(LIMIT_PREFIX + packageName, limitMinutes)
                .putString(LABEL_PREFIX + packageName, label)
                .apply();
    }

    public static boolean removeRule(Context context, String packageName) {
        if (isSettingsLocked(context)) return false;
        prefs(context).edit()
                .remove(LIMIT_PREFIX + packageName)
                .remove(LABEL_PREFIX + packageName)
                .apply();
        return true;
    }

    public static List<AppRule> getRules(Context context) {
        Map<String, ?> all = prefs(context).getAll();
        List<AppRule> rules = new ArrayList<>();
        for (Map.Entry<String, ?> entry : all.entrySet()) {
            String key = entry.getKey();
            if (!key.startsWith(LIMIT_PREFIX) || !(entry.getValue() instanceof Integer)) continue;
            int limit = (Integer) entry.getValue();
            if (limit <= 0) continue;
            String pkg = key.substring(LIMIT_PREFIX.length());
            rules.add(new AppRule(pkg, getLabel(context, pkg), limit));
        }
        Collections.sort(rules, Comparator.comparing(r -> r.label, String.CASE_INSENSITIVE_ORDER));
        return rules;
    }

    public static boolean canSetLimit(Context context, String packageName, int newLimitMinutes) {
        if (!isSettingsLocked(context)) return true;
        int oldLimit = getLimitMinutes(context, packageName);
        if (oldLimit == 0) return true;
        return newLimitMinutes <= oldLimit;
    }

    public static boolean isSettingsLocked(Context context) {
        long until = prefs(context).getLong(LOCKED_UNTIL_DAY, 0L);
        return LocalDate.now().toEpochDay() < until;
    }

    public static void lockSettingsUntilTomorrow(Context context) {
        long tomorrow = LocalDate.now().plusDays(1).toEpochDay();
        prefs(context).edit().putLong(LOCKED_UNTIL_DAY, tomorrow).apply();
    }
}
