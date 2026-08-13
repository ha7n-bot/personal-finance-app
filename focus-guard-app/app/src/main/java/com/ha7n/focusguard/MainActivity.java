package com.ha7n.focusguard;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.provider.Settings;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityManager;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.NumberPicker;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class MainActivity extends android.app.Activity {
    private LinearLayout rulesContainer;
    private TextView usageStatus;
    private TextView accessibilityStatus;
    private TextView lockStatus;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(buildContent());
    }

    @Override
    protected void onResume() {
        super.onResume();
        refresh();
    }

    private View buildContent() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(Color.rgb(248, 250, 252));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        root.setPadding(dp(18), dp(22), dp(18), dp(32));
        scroll.addView(root, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView title = text("حارس الوقت", 30, Color.rgb(15, 23, 42), true);
        root.addView(title);

        TextView subtitle = text("حد يومي صارم لكل تطبيق — عند انتهاء الوقت يُمنع فتح التطبيق حتى اليوم التالي.",
                16, Color.rgb(71, 85, 105), false);
        subtitle.setLineSpacing(0f, 1.2f);
        LinearLayout.LayoutParams subtitleParams = wrap();
        subtitleParams.topMargin = dp(6);
        root.addView(subtitle, subtitleParams);

        root.addView(sectionTitle("التفعيل"), topMargin(26));

        LinearLayout usageCard = card();
        usageStatus = text("", 15, Color.rgb(71, 85, 105), false);
        usageCard.addView(text("1) إذن معرفة وقت الاستخدام", 18, Color.rgb(15, 23, 42), true));
        usageCard.addView(usageStatus, topMargin(5));
        Button usageButton = primaryButton("فتح إعدادات وقت الاستخدام");
        usageButton.setOnClickListener(v -> {
            try {
                startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS));
            } catch (Exception e) {
                startActivity(new Intent(Settings.ACTION_SETTINGS));
            }
        });
        usageCard.addView(usageButton, topMargin(12));
        root.addView(usageCard, topMargin(10));

        LinearLayout accessibilityCard = card();
        accessibilityStatus = text("", 15, Color.rgb(71, 85, 105), false);
        accessibilityCard.addView(text("2) خدمة المنع", 18, Color.rgb(15, 23, 42), true));
        accessibilityCard.addView(accessibilityStatus, topMargin(5));
        Button accessibilityButton = primaryButton("فتح إعدادات إمكانية الوصول");
        accessibilityButton.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)));
        accessibilityCard.addView(accessibilityButton, topMargin(12));
        root.addView(accessibilityCard, topMargin(10));

        Button batteryButton = secondaryButton("إعدادات تحسين البطارية");
        batteryButton.setOnClickListener(v -> {
            try {
                startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
            } catch (Exception e) {
                startActivity(new Intent(Settings.ACTION_SETTINGS));
            }
        });
        root.addView(batteryButton, topMargin(12));

        root.addView(sectionTitle("حدود التطبيقات"), topMargin(28));

        Button addButton = primaryButton("+ إضافة تطبيق وحد يومي");
        addButton.setOnClickListener(v -> showAppPicker());
        root.addView(addButton, topMargin(8));

        lockStatus = text("", 14, Color.rgb(100, 116, 139), false);
        root.addView(lockStatus, topMargin(12));

        Button lockButton = secondaryButton("قفل زيادة الحدود والحذف حتى الغد");
        lockButton.setOnClickListener(v -> confirmLockSettings());
        root.addView(lockButton, topMargin(8));

        rulesContainer = new LinearLayout(this);
        rulesContainer.setOrientation(LinearLayout.VERTICAL);
        root.addView(rulesContainer, topMargin(14));

        LinearLayout note = card();
        note.addView(text("مهم", 17, Color.rgb(15, 23, 42), true));
        TextView noteText = text("بعد تفعيل الإذنين اترك خدمة حارس الوقت مفعلة. يتم احتساب الاستخدام من بداية اليوم، ويُعاد السماح تلقائيًا عند منتصف الليل.",
                14, Color.rgb(71, 85, 105), false);
        noteText.setLineSpacing(0f, 1.2f);
        note.addView(noteText, topMargin(6));
        root.addView(note, topMargin(24));

        return scroll;
    }

    private void refresh() {
        boolean usage = UsageAccessHelper.hasUsageAccess(this);
        boolean access = isServiceEnabled();

        usageStatus.setText(usage ? "✓ مفعّل" : "غير مفعّل — مطلوب لاحتساب الوقت اليومي");
        usageStatus.setTextColor(usage ? Color.rgb(22, 163, 74) : Color.rgb(185, 28, 28));

        accessibilityStatus.setText(access ? "✓ مفعّلة — المنع يعمل" : "غير مفعّلة — لن يتم إغلاق التطبيقات بدونها");
        accessibilityStatus.setTextColor(access ? Color.rgb(22, 163, 74) : Color.rgb(185, 28, 28));

        lockStatus.setText(RuleStore.isSettingsLocked(this)
                ? "🔒 تعديلات اليوم مقفلة: يمكنك فقط تقليل الحد أو إضافة قيود جديدة."
                : "يمكنك تعديل الحدود الآن. فعّل القفل بعد ضبطها حتى لا تمدد الوقت أثناء اليوم.");

        renderRules();
    }

    private void renderRules() {
        rulesContainer.removeAllViews();
        List<AppRule> rules = RuleStore.getRules(this);
        if (rules.isEmpty()) {
            TextView empty = text("لا توجد تطبيقات محددة بعد.", 15, Color.rgb(100, 116, 139), false);
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(0, dp(20), 0, dp(20));
            rulesContainer.addView(empty);
            return;
        }

        for (AppRule rule : rules) {
            rulesContainer.addView(ruleCard(rule), topMargin(10));
        }
    }

    private View ruleCard(AppRule rule) {
        LinearLayout card = card();
        card.setOnClickListener(v -> showLimitDialog(rule.packageName, rule.label, rule.limitMinutes));
        card.setOnLongClickListener(v -> {
            confirmRemove(rule);
            return true;
        });

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        ImageView icon = new ImageView(this);
        try {
            icon.setImageDrawable(getPackageManager().getApplicationIcon(rule.packageName));
        } catch (Exception ignored) {
            icon.setImageResource(android.R.drawable.sym_def_app_icon);
        }
        LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(dp(46), dp(46));
        iconParams.leftMargin = dp(12);
        row.addView(icon, iconParams);

        LinearLayout texts = new LinearLayout(this);
        texts.setOrientation(LinearLayout.VERTICAL);
        texts.addView(text(rule.label, 18, Color.rgb(15, 23, 42), true));
        TextView pkg = text(rule.packageName, 11, Color.rgb(148, 163, 184), false);
        texts.addView(pkg, topMargin(2));
        row.addView(texts, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        TextView limit = text(formatLimit(rule.limitMinutes), 15, Color.rgb(37, 99, 235), true);
        row.addView(limit);
        card.addView(row);

        long used = UsageAccessHelper.getTodayUsageMillis(this, rule.packageName);
        long limitMs = rule.limitMinutes * 60_000L;
        long remaining = Math.max(0L, limitMs - used);
        String status = "اليوم: " + UsageAccessHelper.formatMinutes(used)
                + "   •   المتبقي: " + UsageAccessHelper.formatMinutes(remaining);
        TextView usage = text(status, 14,
                used >= limitMs ? Color.rgb(185, 28, 28) : Color.rgb(71, 85, 105), false);
        card.addView(usage, topMargin(10));
        return card;
    }

    private void showAppPicker() {
        List<AppEntry> allApps = loadLauncherApps();
        List<AppEntry> filtered = new ArrayList<>(allApps);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(8), dp(12), 0);
        box.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        EditText search = new EditText(this);
        search.setHint("ابحث عن تطبيق");
        search.setSingleLine(true);
        box.addView(search, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        ListView list = new ListView(this);
        AppPickerAdapter adapter = new AppPickerAdapter(this, filtered);
        list.setAdapter(adapter);
        box.addView(list, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(480)));

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("اختر التطبيق")
                .setView(box)
                .setNegativeButton("إلغاء", null)
                .create();

        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                String q = s.toString().trim().toLowerCase();
                filtered.clear();
                for (AppEntry app : allApps) {
                    if (q.isEmpty() || app.label.toLowerCase().contains(q)
                            || app.packageName.toLowerCase().contains(q)) {
                        filtered.add(app);
                    }
                }
                adapter.notifyDataSetChanged();
            }
            @Override public void afterTextChanged(Editable s) {}
        });

        list.setOnItemClickListener((parent, view, position, id) -> {
            AppEntry app = filtered.get(position);
            dialog.dismiss();
            int old = RuleStore.getLimitMinutes(this, app.packageName);
            showLimitDialog(app.packageName, app.label, old);
        });

        dialog.show();
    }

    private void showLimitDialog(String pkg, String label, int oldMinutes) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(18), dp(6), dp(18), 0);
        box.setGravity(Gravity.CENTER);
        box.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        TextView hint = text("اختر الحد الإجمالي المسموح لهذا التطبيق خلال اليوم كاملًا.",
                14, Color.rgb(71, 85, 105), false);
        hint.setGravity(Gravity.CENTER);
        box.addView(hint);

        LinearLayout pickers = new LinearLayout(this);
        pickers.setOrientation(LinearLayout.HORIZONTAL);
        pickers.setGravity(Gravity.CENTER);
        pickers.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        NumberPicker hours = new NumberPicker(this);
        hours.setMinValue(0);
        hours.setMaxValue(23);
        hours.setValue(oldMinutes > 0 ? oldMinutes / 60 : 0);

        NumberPicker minutes = new NumberPicker(this);
        minutes.setMinValue(0);
        minutes.setMaxValue(59);
        minutes.setValue(oldMinutes > 0 ? oldMinutes % 60 : 30);

        LinearLayout hourBox = pickerBox("ساعات", hours);
        LinearLayout minuteBox = pickerBox("دقائق", minutes);
        pickers.addView(hourBox);
        pickers.addView(minuteBox);
        box.addView(pickers, topMargin(12));

        LinearLayout presets = new LinearLayout(this);
        presets.setOrientation(LinearLayout.HORIZONTAL);
        presets.setGravity(Gravity.CENTER);
        int[] presetValues = {15, 30, 60, 120};
        String[] presetLabels = {"15د", "30د", "1س", "2س"};
        for (int i = 0; i < presetValues.length; i++) {
            final int value = presetValues[i];
            Button b = smallButton(presetLabels[i]);
            b.setOnClickListener(v -> {
                hours.setValue(value / 60);
                minutes.setValue(value % 60);
            });
            LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(0, dp(44), 1f);
            bp.setMargins(dp(3), 0, dp(3), 0);
            presets.addView(b, bp);
        }
        box.addView(presets, topMargin(14));

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("حد يومي — " + label)
                .setView(box)
                .setPositiveButton("حفظ", null)
                .setNegativeButton("إلغاء", null)
                .create();

        dialog.setOnShowListener(d -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            int total = hours.getValue() * 60 + minutes.getValue();
            if (total <= 0) {
                Toast.makeText(this, "اختر دقيقة واحدة على الأقل", Toast.LENGTH_SHORT).show();
                return;
            }
            if (!RuleStore.canSetLimit(this, pkg, total)) {
                Toast.makeText(this, "الإعدادات مقفلة حتى الغد؛ لا يمكن زيادة الحد اليوم.", Toast.LENGTH_LONG).show();
                return;
            }
            RuleStore.setRule(this, pkg, label, total);
            dialog.dismiss();
            refresh();
        }));

        dialog.show();
    }

    private LinearLayout pickerBox(String label, NumberPicker picker) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(10), 0, dp(10), 0);
        box.addView(picker);
        TextView t = text(label, 13, Color.rgb(71, 85, 105), false);
        t.setGravity(Gravity.CENTER);
        box.addView(t);
        return box;
    }

    private void confirmLockSettings() {
        if (RuleStore.isSettingsLocked(this)) {
            Toast.makeText(this, "الإعدادات مقفلة بالفعل حتى الغد", Toast.LENGTH_SHORT).show();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("قفل تعديلات اليوم؟")
                .setMessage("حتى منتصف الليل لن تستطيع زيادة أي حد أو حذف تطبيق من القائمة. سيبقى مسموحًا تقليل الحدود أو إضافة قيود جديدة.")
                .setPositiveButton("نعم، اقفلها", (d, w) -> {
                    RuleStore.lockSettingsUntilTomorrow(this);
                    refresh();
                })
                .setNegativeButton("إلغاء", null)
                .show();
    }

    private void confirmRemove(AppRule rule) {
        if (RuleStore.isSettingsLocked(this)) {
            Toast.makeText(this, "لا يمكن الحذف حتى الغد لأن تعديلات اليوم مقفلة", Toast.LENGTH_LONG).show();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("حذف الحد؟")
                .setMessage("سيتم إلغاء الحد اليومي عن " + rule.label)
                .setPositiveButton("حذف", (d, w) -> {
                    RuleStore.removeRule(this, rule.packageName);
                    refresh();
                })
                .setNegativeButton("إلغاء", null)
                .show();
    }

    private List<AppEntry> loadLauncherApps() {
        PackageManager pm = getPackageManager();
        Intent intent = new Intent(Intent.ACTION_MAIN, null);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> infos = pm.queryIntentActivities(intent, 0);
        List<AppEntry> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ResolveInfo info : infos) {
            String pkg = info.activityInfo.packageName;
            if (getPackageName().equals(pkg) || !seen.add(pkg)) continue;
            CharSequence cs = info.loadLabel(pm);
            String label = cs != null ? cs.toString() : pkg;
            Drawable icon = info.loadIcon(pm);
            result.add(new AppEntry(pkg, label, icon));
        }
        Collections.sort(result, Comparator.comparing(a -> a.label, String.CASE_INSENSITIVE_ORDER));
        return result;
    }

    private boolean isServiceEnabled() {
        AccessibilityManager manager = (AccessibilityManager) getSystemService(Context.ACCESSIBILITY_SERVICE);
        List<AccessibilityServiceInfo> services = manager.getEnabledAccessibilityServiceList(
                AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
        String expected = getPackageName() + "/" + LimitAccessibilityService.class.getName();
        for (AccessibilityServiceInfo info : services) {
            if (info.getResolveInfo() == null || info.getResolveInfo().serviceInfo == null) continue;
            String id = info.getId();
            if (expected.equals(id) || (getPackageName().equals(info.getResolveInfo().serviceInfo.packageName)
                    && LimitAccessibilityService.class.getName().equals(info.getResolveInfo().serviceInfo.name))) {
                return true;
            }
        }
        return false;
    }

    private LinearLayout card() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.WHITE);
        bg.setCornerRadius(dp(16));
        bg.setStroke(dp(1), Color.rgb(226, 232, 240));
        card.setBackground(bg);
        return card;
    }

    private TextView sectionTitle(String value) {
        return text(value, 20, Color.rgb(15, 23, 42), true);
    }

    private TextView text(String value, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        t.setTextDirection(View.TEXT_DIRECTION_FIRST_STRONG_RTL);
        return t;
    }

    private Button primaryButton(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(15f);
        b.setTextColor(Color.WHITE);
        b.setAllCaps(false);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.rgb(37, 99, 235));
        bg.setCornerRadius(dp(12));
        b.setBackground(bg);
        b.setMinHeight(dp(52));
        return b;
    }

    private Button secondaryButton(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(15f);
        b.setTextColor(Color.rgb(30, 64, 175));
        b.setAllCaps(false);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.rgb(239, 246, 255));
        bg.setCornerRadius(dp(12));
        bg.setStroke(dp(1), Color.rgb(191, 219, 254));
        b.setBackground(bg);
        b.setMinHeight(dp(50));
        return b;
    }

    private Button smallButton(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(13f);
        b.setAllCaps(false);
        b.setTextColor(Color.rgb(30, 64, 175));
        return b;
    }

    private LinearLayout.LayoutParams wrap() {
        return new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    private LinearLayout.LayoutParams topMargin(int marginDp) {
        LinearLayout.LayoutParams p = wrap();
        p.topMargin = dp(marginDp);
        return p;
    }

    private String formatLimit(int minutes) {
        int h = minutes / 60;
        int m = minutes % 60;
        if (h > 0 && m > 0) return h + "س " + m + "د";
        if (h > 0) return h + "س";
        return m + "د";
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private static final class AppPickerAdapter extends BaseAdapter {
        private final Context context;
        private final List<AppEntry> items;

        AppPickerAdapter(Context context, List<AppEntry> items) {
            this.context = context;
            this.items = items;
        }

        @Override public int getCount() { return items.size(); }
        @Override public Object getItem(int position) { return items.get(position); }
        @Override public long getItemId(int position) { return position; }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            AppEntry app = items.get(position);
            LinearLayout row = new LinearLayout(context);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(context, 8), dp(context, 10), dp(context, 8), dp(context, 10));
            row.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

            ImageView icon = new ImageView(context);
            icon.setImageDrawable(app.icon);
            LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(dp(context, 42), dp(context, 42));
            ip.leftMargin = dp(context, 12);
            row.addView(icon, ip);

            LinearLayout texts = new LinearLayout(context);
            texts.setOrientation(LinearLayout.VERTICAL);
            TextView name = new TextView(context);
            name.setText(app.label);
            name.setTextSize(16f);
            name.setTextColor(Color.rgb(15, 23, 42));
            name.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
            texts.addView(name);
            TextView pkg = new TextView(context);
            pkg.setText(app.packageName);
            pkg.setTextSize(11f);
            pkg.setTextColor(Color.rgb(100, 116, 139));
            texts.addView(pkg);
            row.addView(texts, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
            return row;
        }

        private static int dp(Context context, int value) {
            return Math.round(value * context.getResources().getDisplayMetrics().density);
        }
    }
}
