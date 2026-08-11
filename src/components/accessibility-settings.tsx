"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AppIcon } from "@/components/app-icon";

type FontSize = "compact" | "comfortable" | "large" | "xlarge";
type FontWeight = "regular" | "strong";
type Preferences = {
  fontSize: FontSize;
  fontWeight: FontWeight;
  highContrast: boolean;
  reduceMotion: boolean;
};

const STORAGE_KEY = "mali-accessibility-v1";
const defaults: Preferences = {
  fontSize: "comfortable",
  fontWeight: "strong",
  highContrast: false,
  reduceMotion: false,
};

function isFontSize(value: unknown): value is FontSize {
  return ["compact", "comfortable", "large", "xlarge"].includes(String(value));
}

function isFontWeight(value: unknown): value is FontWeight {
  return value === "regular" || value === "strong";
}

function applyPreferences(preferences: Preferences) {
  const root = document.documentElement;
  root.dataset.maliFont = preferences.fontSize;
  root.dataset.maliWeight = preferences.fontWeight;
  root.dataset.maliContrast = preferences.highContrast ? "high" : "normal";
  root.dataset.maliMotion = preferences.reduceMotion ? "reduced" : "full";
}

export function AccessibilitySettings() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let next = defaults;
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<Preferences> | null;
      if (stored) next = {
        fontSize: isFontSize(stored.fontSize) ? stored.fontSize : defaults.fontSize,
        fontWeight: isFontWeight(stored.fontWeight) ? stored.fontWeight : defaults.fontWeight,
        highContrast: Boolean(stored.highContrast),
        reduceMotion: Boolean(stored.reduceMotion),
      };
    } catch { /* keep readable defaults */ }
    setPreferences(next);
    applyPreferences(next);
    setReady(true);
  }, []);

  function update(patch: Partial<Preferences>) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    applyPreferences(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return <section className="card settings-section accessibility-section" aria-busy={!ready}>
    <div className="settings-section-heading">
      <span className="settings-icon"><AppIcon name="text"/></span>
      <div><h2>وضوح الخط والواجهة</h2><p>غيّر حجم الكتابة وسُمكها على هذا الجهاز، وستشاهد النتيجة مباشرة.</p></div>
    </div>

    <div className="preference-block">
      <strong>حجم الخط</strong>
      <div className="segmented-options font-size-options" role="group" aria-label="حجم الخط">
        {([
          ["compact", "صغير"],
          ["comfortable", "مريح"],
          ["large", "كبير"],
          ["xlarge", "كبير جدًا"],
        ] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={preferences.fontSize === value} onClick={() => update({ fontSize: value })}>{label}</button>)}
      </div>
    </div>

    <div className="preference-block">
      <strong>سُمك الخط</strong>
      <div className="segmented-options" role="group" aria-label="سُمك الخط">
        <button type="button" aria-pressed={preferences.fontWeight === "regular"} onClick={() => update({ fontWeight: "regular" })}>عادي وواضح</button>
        <button type="button" aria-pressed={preferences.fontWeight === "strong"} onClick={() => update({ fontWeight: "strong" })}>أوضح وأثقل</button>
      </div>
    </div>

    <div className="preference-toggles">
      <label><span><AppIcon name="contrast"/><b>تباين أعلى</b><small>يقوّي الحدود والنصوص الثانوية.</small></span><input type="checkbox" checked={preferences.highContrast} onChange={(event) => update({ highContrast: event.target.checked })}/></label>
      <label><span><AppIcon name="settings"/><b>تقليل الحركة</b><small>يخفف الانتقالات والمؤثرات البصرية.</small></span><input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => update({ reduceMotion: event.target.checked })}/></label>
    </div>

    <div className="font-preview" aria-live="polite"><small>معاينة</small><strong>أموالك أوضح وقراراتك أذكى</strong><span>١٢٬٥٠٠ ر.س — فاتورة الكهرباء ٣٤٠ ر.س</span></div>
    <button className="text-button settings-reset" type="button" onClick={() => update(defaults)}>إعادة الإعدادات الافتراضية</button>
  </section>;
}

export function ThemePreference() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? theme || "system" : "system";
  return <div className="preference-block theme-preference">
    <strong>مظهر التطبيق</strong>
    <div className="segmented-options" role="group" aria-label="مظهر التطبيق">
      {([[
        "system", "حسب الجهاز",
      ], ["light", "فاتح"], ["dark", "داكن"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={current === value} onClick={() => setTheme(value)}>{label}</button>)}
    </div>
  </div>;
}
