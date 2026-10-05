import { useState, useMemo } from "react";

import imgLogo from './assets/450dd.svg';
import imgLogoSvg from './assets/3ad7c.svg';
import imgChevronDown from './assets/chevron-down.svg';
import imgChevronDown2 from './assets/chevron-down2.svg';
// const imgLogo = `${import.meta.env.BASE_URL}assets/450dd.png`;
// const imgLogoSvg = `${import.meta.env.BASE_URL}assets/3ad7c.svg`;

// ────────────────────────────────────────────────────────────
// Japanese holiday calculation
// ────────────────────────────────────────────────────────────

function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === weekday) {
      count++;
      if (count === n) return d;
    }
  }
  return -1;
}

function getJapaneseHolidays(year: number, month: number): Record<number, string> {
  const holidays: Record<string, string> = {};

  const add = (y: number, m: number, d: number, name: string) => {
    if (m === month) holidays[d] = name;
  };

  add(year, 1, 1, "元日");
  add(year, 2, 11, "建国記念の日");
  add(year, 2, 23, "天皇誕生日");
  add(year, 4, 29, "昭和の日");
  add(year, 5, 3, "憲法記念日");
  add(year, 5, 4, "みどりの日");
  add(year, 5, 5, "こどもの日");
  add(year, 8, 11, "山の日");
  add(year, 11, 3, "文化の日");
  add(year, 11, 23, "勤労感謝の日");

  add(year, 1, nthWeekday(year, 1, 1, 2), "成人の日");
  add(year, 7, nthWeekday(year, 7, 1, 3), "海の日");
  add(year, 9, nthWeekday(year, 9, 1, 3), "敬老の日");
  add(year, 10, nthWeekday(year, 10, 1, 2), "スポーツの日");

  const shunbun = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  add(year, 3, shunbun, "春分の日");
  const shubun = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  add(year, 9, shubun, "秋分の日");

  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 2; d <= daysInMonth - 1; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && !holidays[d] && holidays[d - 1] && holidays[d + 1]) {
      holidays[d] = "国民の休日";
    }
  }

  const snapshot = { ...holidays };
  for (const [ds, name] of Object.entries(snapshot)) {
    const d = Number(ds);
    const dow = new Date(year, month - 1, d).getDay();
    if (dow === 0) {
      let sub = d + 1;
      while (holidays[sub]) sub++;
      if (sub <= daysInMonth && sub !== d + 1 + 7) {
        add(year, month, sub, `振替休日(${name})`);
      } else if (sub <= daysInMonth) {
        add(year, month, sub, "振替休日");
      }
    }
  }

  return holidays as Record<number, string>;
}

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type Screen =
  | "login"
  | "home"
  | "menu"
  | "worktime"
  | "worktime-pattern"
  | "worktime-pattern-done"
  | "leave"
  | "leave-done"
  | "user-edit";

interface WorkRecord {
  type: string;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
}

interface LeaveRecord {
  type: string;
  date: string;
}

export interface PatternRecord {
  id: string;
  type: string;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
  bulkWeekdays: boolean;
}

// ────────────────────────────────────────────────────────────
// Shared UI Components
// ────────────────────────────────────────────────────────────

function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="bg-white flex items-center justify-between overflow-hidden px-[10px] py-[4px] w-full shrink-0">
      <img src={imgLogo} alt="TAsystem" className="h-[41px] w-[108px] object-cover" />
      <button onClick={onMenu} className="cursor-pointer flex flex-col items-center justify-center w-[16px]">
        <span
          className="not-italic text-[#005293] text-[16px] text-center w-full leading-normal"
          style={{ fontFamily: "'Font Awesome 6 Free:Solid'" }}
        >
          {""}
        </span>
      </button>
    </div>
  );
}

function PageTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex gap-[14px] items-center px-[20px]">
      <span
        className="not-italic text-[#005293] text-[16px] text-center leading-normal"
        style={{ fontFamily: "'Font Awesome 6 Free:Solid'" }}
      >
        {icon}
      </span>
      <p className="text-[#3d4b56] text-[16px] leading-normal" style={{ fontFamily: "'Noto Sans JP:Medium'" }}>
        {title}
      </p>
    </div>
  );
}

function PrimaryButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#005293] cursor-pointer flex h-[54px] items-center justify-center px-[60px] py-[10px] rounded-[8px] w-full max-w-[352px]"
    >
      <span
        className="text-white text-[14px] leading-normal whitespace-nowrap"
        style={{ fontFamily: "'Noto Sans JP:Black'" }}
      >
        {label}
      </span>
    </button>
  );
}

function SecondaryButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-[#005293] cursor-pointer flex h-[54px] items-center justify-center px-[60px] py-[10px] rounded-[8px] w-full max-w-[352px]"
    >
      <span
        className="text-[#005293] text-[14px] leading-normal whitespace-nowrap"
        style={{ fontFamily: "'Noto Sans JP:Black'" }}
      >
        {label}
      </span>
    </button>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border border-[#e6e6e6] rounded-[8px] px-[11px] py-[6px] text-[16px] text-black leading-[22px] tracking-[-0.43px] whitespace-nowrap"
      style={{ fontFamily: "system-ui" }}
    />
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-[8px] items-center w-full justify-between">
      <span
        className="text-[#1e1e1e] text-[15px] leading-[1.4] shrink-0"
        style={{ fontFamily: "'Inter:Regular'" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-[#d9d9d9] rounded-[8px] h-[38px] pl-[12px] pr-[32px] text-[#1e1e1e] text-[15px] appearance-none cursor-pointer"
        style={{ fontFamily: "'Inter:Regular'" }}
      >
        <option value="">選択</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <img
        src={imgChevronDown}
        alt=""
        className="absolute right-[10px] top-1/2 -translate-y-1/2 size-[16px] pointer-events-none"
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Calendar & Action Sheet & Menu
// ────────────────────────────────────────────────────────────

function Calendar({
  year,
  month,
  today,
  workRecords,
  leaveRecords,
  onPrev,
  onNext,
  onDayClick,
}: {
  year: number;
  month: number;
  today: Date;
  workRecords: Record<string, WorkRecord>;
  leaveRecords: Record<string, LeaveRecord>;
  onPrev: () => void;
  onNext: () => void;
  onDayClick: (day: number) => void;
}) {
  const holidays = useMemo(() => getJapaneseHolidays(year, month), [year, month]);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d;

  const isSunday = (d: number) => new Date(year, month - 1, d).getDay() === 0;
  const isSaturday = (d: number) => new Date(year, month - 1, d).getDay() === 6;

  const dayKey = (d: number) => `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getDayColor = (d: number) => {
    if (holidays[d] || isSunday(d)) return "text-[#e80004]";
    if (isSaturday(d)) return "text-[#015de7]";
    return "text-[#3d4b56]";
  };

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, current: false });
    }
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const DOW = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="bg-white flex flex-col gap-[3px] w-full">
      <div className="flex gap-[85px] items-center justify-center py-[6px]">
        <button
          onClick={onPrev}
          className="bg-white overflow-hidden size-[24px] flex items-center justify-center cursor-pointer"
        >
          <span className="not-italic text-[#3d4b56] text-[14px]" style={{ fontFamily: "'Font Awesome 6 Free:Solid'" }}>
            {""}
          </span>
        </button>
        <div className="flex items-center px-[12px] py-[6px]">
          <span className="text-[#252525] text-[20px] text-center whitespace-nowrap leading-[1.25]" style={{ fontFamily: "'Lato:Medium'" }}>
            {year}年{month}月
          </span>
        </div>
        <button
          onClick={onNext}
          className="bg-white overflow-hidden size-[24px] flex items-center justify-center cursor-pointer"
        >
          <span className="not-italic text-[#3d4b56] text-[14px]" style={{ fontFamily: "'Font Awesome 6 Free:Solid'" }}>
            {""}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-center pb-[4px] w-full">
        {DOW.map((d) => (
          <div key={d} className="flex-1 flex items-center justify-center h-[24px]">
            <span className="opacity-50 text-[#3d4b56] text-[12px] text-center leading-[1.25]" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
              {d}
            </span>
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="flex items-start min-h-[90px] w-full">
          {week.map((cell, ci) => {
            const { day, current } = cell;
            const key = current ? dayKey(day) : "";
            const work = current && workRecords[key];
            const leave = current && leaveRecords[key];
            const holiday = current && holidays[day];
            const todayCell = current && isToday(day);
            const color = current ? getDayColor(day) : "";

            return (
              <button
                key={ci}
                onClick={() => current && onDayClick(day)}
                className={`flex-1 flex flex-col gap-[2px] items-center min-w-0 overflow-hidden p-[2px] self-stretch bg-white ${
                  todayCell ? "border border-[#005293]" : ""
                } ${current ? "cursor-pointer" : ""}`}
              >
              <div className="relative size-[24px] flex items-center justify-center shrink-0">
                {todayCell && <div className="absolute inset-0 rounded-full bg-[#1e40af]" />}
                <span
                  className={`text-[10px] text-center leading-[1.25] relative z-10 ${
                    current ? (todayCell ? "text-white" : color) : "opacity-50 text-[#8a8a8a]"
                  }`}
                  style={{ fontFamily: current ? "'Noto Sans JP:Regular'" : "'Lato:Regular'" }}
                >
                  {day}
                </span>
              </div>

                {current && holiday && !work && (
                  <div className="bg-[#ffe1e1] flex items-center justify-center h-[14px] overflow-hidden rounded-[2px] w-full shrink-0">
                    <span className="text-[#3d4b56] text-[8px] pl-[4px] leading-[14px] whitespace-nowrap" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
                      祝日
                    </span>
                  </div>
                )}
                {current && work && (
                  <div className="bg-[#ebeff0] flex items-center justify-center h-[14px] overflow-hidden rounded-[2px] w-full shrink-0">
                    <span className="text-[#3d4b56] text-[8px] pl-[4px] leading-[14px] whitespace-nowrap" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
                      {work.type || "日勤"}
                    </span>
                  </div>
                )}
                {current && leave && (
                  <div className="bg-[#ffe1e1] flex items-center justify-center h-[14px] overflow-hidden rounded-[2px] w-full shrink-0">
                    <span className="text-[#3d4b56] text-[8px] pl-[4px] leading-[14px] whitespace-nowrap" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
                      {leave.type || "有給休暇"}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ActionSheet({
  day,
  month,
  year,
  onWorktime,
  onLeave,
  onClose,
}: {
  day: number;
  month: number;
  year: number;
  onWorktime: () => void;
  onLeave: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white drop-shadow-[0px_-4px_3px_rgba(141,141,141,0.25)] flex flex-col gap-[13px] items-start p-[20px] rounded-tl-[10px] rounded-tr-[10px]">
        <div className="flex items-center justify-center w-full">
          <span className="text-[16px] text-black text-center whitespace-nowrap leading-normal" style={{ fontFamily: "'Noto Sans JP:Medium'" }}>
            {month}月{day}日
          </span>
        </div>
        <div className="flex gap-[32px] items-start justify-center w-full">
          <button onClick={onWorktime} className="cursor-pointer flex flex-col gap-[6px] items-center justify-center w-[96px]">
            <span className="not-italic text-[#005293] text-[46px] text-center leading-normal" style={{ fontFamily: "'Font Awesome 6 Free:Solid'" }}>
              {""}
            </span>
            <span className="text-[#556b7c] text-[16px] text-center leading-normal" style={{ fontFamily: "'Noto Sans JP:Medium'" }}>
              勤務時間登録
            </span>
          </button>
          <button onClick={onLeave} className="cursor-pointer flex flex-col gap-[6px] items-center justify-center w-[96px]">
            <span className="not-italic text-[#005293] text-[46px] text-center leading-normal" style={{ fontFamily: "'Font Awesome 6 Free:Solid'" }}>
              {""}
            </span>
            <span className="text-[#556b7c] text-[16px] text-center leading-normal whitespace-nowrap" style={{ fontFamily: "'Noto Sans JP:Medium'" }}>
              休暇申請
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

function MenuOverlay({ onClose, navigate }: { onClose: () => void; navigate: (s: Screen) => void }) {
  const items: { icon: string; label: string; screen: Screen }[] = [
    { icon: "", label: "ホーム", screen: "home" },
    { icon: "", label: "ユーザー編集", screen: "user-edit" },
    { icon: "", label: "ログアウト", screen: "login" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f4f5] flex flex-col gap-[10px] items-center">
      <div className="bg-white flex items-center justify-between overflow-hidden px-[10px] py-[4px] w-full shrink-0">
        <img src={imgLogo} alt="TAsystem" className="h-[41px] w-[108px] object-cover" />
        <button onClick={onClose} className="cursor-pointer flex flex-col items-center justify-center w-[16px]">
          <span className="not-italic text-[#005293] text-[16px] text-center w-full leading-normal" style={{ fontFamily: "'Font Awesome 6 Free:Solid'" }}>
            {""}
          </span>
        </button>
      </div>
      <div className="flex flex-col gap-[20px] items-start pb-[20px] w-full px-[14px]">
        {items.map(({ icon, label, screen }) => (
          <button
            key={screen}
            onClick={() => { navigate(screen); onClose(); }}
            className="cursor-pointer flex items-center justify-between py-[5px] w-full"
          >
            <div className="flex gap-[14px] items-center">
              <span className="not-italic text-[#8a8a8a] text-[16px] text-center leading-normal w-[16px]" style={{ fontFamily: "'Font Awesome 6 Free:Solid'" }}>
                {icon}
              </span>
              <span className="text-[#556b7c] text-[16px] leading-normal whitespace-nowrap" style={{ fontFamily: "'Noto Sans JP:Medium'" }}>
                {label}
              </span>
            </div>
            <span className="not-italic text-[#8a8a8a] text-[12px] text-center leading-normal" style={{ fontFamily: "'Font Awesome 6 Free:Solid'" }}>
              {""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SCREENS
// ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="bg-white flex flex-col min-h-dvh">
      <div className="flex flex-col gap-[47px] items-center px-[10px] pt-[49px]">
        <div className="flex flex-col gap-[7px] items-center w-[214px]">
          <img src={imgLogo} alt="TAsystem" className="w-full aspect-[1600/600] object-cover" />
          <p className="text-[#3d4b56] text-[16px] text-center leading-normal" style={{ fontFamily: "'Noto Sans JP:Bold'" }}>
            ログイン
          </p>
        </div>
        <div className="flex flex-col gap-[20px] w-full box-border">
          /* ID入力エリア */
          <div className="flex flex-col sm:flex-row sm:items-center gap-[8px] sm:gap-[16px] w-full">
            <div className="flex items-center text-[16px] shrink-0" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
              <span className="text-[#e80004] w-[8px]">*</span>
              <span className="text-[#3d4b56] w-[8px] sm:w-[80px]">ID</span>
            </div>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="IDの入力"
              className="bg-white border border-[#e0e4eb] rounded-[6px] w-full sm:flex-1 px-[16px] py-[12px] text-[16px] text-[#3d4b56] placeholder-[#8a8a8a] min-w-0 box-border"
              style={{ fontFamily: "'Noto Sans JP:Regular'" }}
            />
          </div>

          /* パスワード入力エリア */
          <div className="flex flex-col sm:flex-row sm:items-center gap-[8px] sm:gap-[16px] w-full">
            <div className="flex items-center text-[16px] shrink-0" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
              <span className="text-[#e80004] w-[8px]">*</span>
              <span className="text-[#3d4b56] w-[8px] sm:w-[80px]">パスワード</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードの入力"
              className="bg-white border border-[#e0e4eb] rounded-[6px] w-full sm:flex-1 px-[16px] py-[12px] text-[16px] text-[#3d4b56] placeholder-[#8a8a8a] min-w-0 box-border"
              style={{ fontFamily: "'Noto Sans JP:Regular'" }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[24px] items-center px-[10px] pt-[60px] pb-[40px]">
        <PrimaryButton label="ログイン" onClick={onLogin} />
        <SecondaryButton label="パスワードを忘れた方" />
      </div>
    </div>
  );
}

function HomeScreen({
  onMenu,
  navigate,
  workRecords,
  leaveRecords,
  onDaySelect,
}: {
  onMenu: () => void;
  navigate: (s: Screen) => void;
  workRecords: Record<string, WorkRecord>;
  leaveRecords: Record<string, LeaveRecord>;
  onDaySelect: (year: number, month: number, day: number) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  return (
    <div className="bg-[#f4f4f5] flex flex-col min-h-dvh">
      <Header onMenu={onMenu} />
      <div className="flex flex-col gap-[16px] items-start w-full py-[16px]">
        <PageTitle icon={""} title="ホーム" />
        <Calendar
          year={year}
          month={month}
          today={today}
          workRecords={workRecords}
          leaveRecords={leaveRecords}
          onPrev={prevMonth}
          onNext={nextMonth}
          onDayClick={(d) => setSelectedDay(d)}
        />
      </div>
      <div className="flex justify-center px-[10px] pb-[40px]">
        <PrimaryButton label="勤務時間パターン登録" onClick={() => navigate("worktime-pattern")} />
      </div>

      {selectedDay !== null && (
        <ActionSheet
          day={selectedDay}
          month={month}
          year={year}
          onWorktime={() => { onDaySelect(year, month, selectedDay); navigate("worktime"); setSelectedDay(null); }}
          onLeave={() => { onDaySelect(year, month, selectedDay); navigate("leave"); setSelectedDay(null); }}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

function WorktimeScreen({
  onMenu,
  navigate,
  selectedDate,
  onSave,
}: {
  onMenu: () => void;
  navigate: (s: Screen) => void;
  selectedDate: { year: number; month: number; day: number } | null;
  onSave: (key: string, record: WorkRecord) => void;
}) {
  const [type, setType] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");

  const handleSave = () => {
    if (selectedDate) {
      const key = `${selectedDate.year}-${String(selectedDate.month).padStart(2, "0")}-${String(selectedDate.day).padStart(2, "0")}`;
      onSave(key, { type: type || "日勤", start, end, breakStart, breakEnd });
    }
    navigate("home");
  };

  const dateLabel = selectedDate ? `${selectedDate.month}月${selectedDate.day}日` : "";

  return (
    <div className="bg-[#f4f4f5] flex flex-col min-h-dvh">
      <Header onMenu={onMenu} />
      <div className="flex flex-col gap-[16px] items-start px-[10px] py-[16px] w-full">
        <PageTitle icon={""} title={`勤務時間登録${dateLabel ? ` (${dateLabel})` : ""}`} />
        <div className="bg-white flex flex-col gap-[16px] items-start p-[20px] w-full rounded-[4px]">
          <FormRow label="登録区分">
            <SelectField value={type} onChange={setType} options={["日勤", "夜勤", "早番", "遅番"]} />
          </FormRow>
          <FormRow label="始業時間">
            <TimeInput value={start} onChange={setStart} />
          </FormRow>
          <FormRow label="終業時間">
            <TimeInput value={end} onChange={setEnd} />
          </FormRow>
          <FormRow label="昼休憩開始時間">
            <TimeInput value={breakStart} onChange={setBreakStart} />
          </FormRow>
          <FormRow label="昼休憩終了時間">
            <TimeInput value={breakEnd} onChange={setBreakEnd} />
          </FormRow>
        </div>
      </div>
      <div className="flex flex-col gap-[16px] items-center px-[10px] pb-[40px]">
        <PrimaryButton label="登録" onClick={handleSave} />
        <SecondaryButton label="ホームに戻る" onClick={() => navigate("home")} />
      </div>
    </div>
  );
}

function WorktimePatternScreen({
  onMenu,
  navigate,
  onSavePattern,
}: {
  onMenu: () => void;
  navigate: (s: Screen) => void;
  onSavePattern: (record: Omit<PatternRecord, "id">) => void;
}) {
  const [type, setType] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [bulkWeekdays, setBulkWeekdays] = useState(false);

  const handleRegister = () => {
    onSavePattern({
      type: type || "日勤",
      start,
      end,
      breakStart,
      breakEnd,
      bulkWeekdays,
    });
    navigate("worktime-pattern-done");
  };

  return (
    <div className="bg-[#f4f4f5] flex flex-col min-h-dvh">
      <Header onMenu={onMenu} />
      <div className="flex flex-col gap-[16px] items-start px-[10px] py-[16px] w-full">
        <PageTitle icon={""} title="勤務時間パターン登録" />
        <div className="bg-white flex flex-col gap-[16px] items-start p-[20px] w-full rounded-[4px]">
          <FormRow label="登録区分">
            <SelectField value={type} onChange={setType} options={["日勤", "夜勤", "早番", "遅番"]} />
          </FormRow>
          <FormRow label="始業時間">
            <TimeInput value={start} onChange={setStart} />
          </FormRow>
          <FormRow label="終業時間">
            <TimeInput value={end} onChange={setEnd} />
          </FormRow>
          <FormRow label="昼休憩開始時間">
            <TimeInput value={breakStart} onChange={setBreakStart} />
          </FormRow>
          <FormRow label="昼休憩終了時間">
            <TimeInput value={breakEnd} onChange={setBreakEnd} />
          </FormRow>
          <div className="flex flex-col gap-[4px] pt-2">
            <label className="flex items-center gap-[8px] cursor-pointer">
              <input
                type="checkbox"
                checked={bulkWeekdays}
                onChange={(e) => setBulkWeekdays(e.target.checked)}
                className="w-[18px] h-[18px] accent-[#005293]"
              />
              <span className="text-[#1e1e1e] text-[16px] leading-normal" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
                平日一括登録
              </span>
            </label>
            <p className="text-[#8a8a8a] text-[13px] leading-normal pl-[26px]" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
              当月の平日を一括登録します
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[16px] items-center px-[10px] pb-[40px]">
        <PrimaryButton label="登録" onClick={handleRegister} />
        <SecondaryButton label="ホームに戻る" onClick={() => navigate("home")} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// パターン登録完了画面 (アコーディオン内一覧 & インライン修正・削除機能)
// ────────────────────────────────────────────────────────────
function WorktimePatternDoneScreen({
  onMenu,
  navigate,
  patterns,
  onUpdatePattern,
  onDeletePattern,
}: {
  onMenu: () => void;
  navigate: (s: Screen) => void;
  patterns: PatternRecord[];
  onUpdatePattern: (updated: PatternRecord) => void;
  onDeletePattern: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<PatternRecord | null>(null);

  const startEdit = (p: PatternRecord) => {
    setEditingId(p.id);
    setEditFormData({ ...p });
  };

  const handleSaveEdit = () => {
    if (editFormData) {
      onUpdatePattern(editFormData);
      setEditingId(null);
      setEditFormData(null);
    }
  };

  return (
    <div className="bg-[#f4f4f5] flex flex-col min-h-dvh">
      <Header onMenu={onMenu} />
      <div className="flex flex-col gap-[16px] items-start px-[10px] py-[16px] w-full">
        <PageTitle icon={""} title="勤務時間パターン登録" />
        <div className="bg-white flex flex-col gap-[16px] items-start p-[20px] w-full rounded-[4px]">
          <p className="text-[16px] text-black leading-normal" style={{ fontFamily: "'Noto Sans JP:Medium'" }}>
            登録完了しました。
          </p>

          <button
            onClick={() => setOpen((o) => !o)}
            className="bg-[#f5f5f5] border border-[#d9d9d9] flex items-center justify-between p-[16px] rounded-[8px] w-full cursor-pointer"
          >
            <span className="text-[#1e1e1e] text-[16px] leading-[1.4]" style={{ fontFamily: "'Inter:Semi Bold'" }}>
              登録済み勤務時間 ({patterns.length}件)
            </span>
            <img
              src={imgChevronDown}
              alt=""
              className="absolute right-[10px] top-1/2 -translate-y-1/2 size-[16px] pointer-events-none"
            />
          </button>

          {open && (
            <div className="w-full space-y-3 pt-1">
              {patterns.length === 0 ? (
                <p className="text-[#8a8a8a] text-[14px] leading-normal pl-[4px]" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
                  登録済みの勤務パターンはありません。
                </p>
              ) : (
                patterns.map((item) => (
                  <div key={item.id} className="border border-[#e0e4eb] p-3 rounded-lg bg-[#fafafa] space-y-3">
                    {editingId === item.id && editFormData ? (
                      /* 編集モード */
                      <div className="space-y-2 text-sm text-[#3d4b56]">
                        <FormRow label="登録区分">
                          <SelectField
                            value={editFormData.type}
                            onChange={(v) => setEditFormData({ ...editFormData, type: v })}
                            options={["日勤", "夜勤", "早番", "遅番"]}
                          />
                        </FormRow>
                        <FormRow label="始業時間">
                          <TimeInput
                            value={editFormData.start}
                            onChange={(v) => setEditFormData({ ...editFormData, start: v })}
                          />
                        </FormRow>
                        <FormRow label="終業時間">
                          <TimeInput
                            value={editFormData.end}
                            onChange={(v) => setEditFormData({ ...editFormData, end: v })}
                          />
                        </FormRow>
                        <FormRow label="昼休憩開始">
                          <TimeInput
                            value={editFormData.breakStart}
                            onChange={(v) => setEditFormData({ ...editFormData, breakStart: v })}
                          />
                        </FormRow>
                        <FormRow label="昼休憩終了">
                          <TimeInput
                            value={editFormData.breakEnd}
                            onChange={(v) => setEditFormData({ ...editFormData, breakEnd: v })}
                          />
                        </FormRow>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded font-medium cursor-pointer"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1.5 bg-[#005293] text-white text-xs rounded font-medium cursor-pointer"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 一覧表示モード */
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[15px] text-[#005293]">{item.type || "日勤"}</span>
                            {item.bulkWeekdays && (
                              <span className="text-[10px] bg-[#005293]/10 text-[#005293] px-1.5 py-0.5 rounded font-medium">
                                平日一括
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            勤務: <span className="font-medium text-gray-800">{item.start} ～ {item.end}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            休憩: {item.breakStart} ～ {item.breakEnd}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="px-3 py-1.5 bg-[#005293] text-white text-xs font-medium rounded hover:bg-[#003d6e] transition-colors cursor-pointer"
                          >
                            修正
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("このパターンを削除してもよろしいですか？")) {
                                onDeletePattern(item.id);
                              }
                            }}
                            className="px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-medium rounded hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-[16px] items-center px-[10px] pb-[40px]">
        <SecondaryButton label="ホームに戻る" onClick={() => navigate("home")} />
      </div>
    </div>
  );
}

function LeaveScreen({
  onMenu,
  navigate,
  selectedDate,
  onSave,
}: {
  onMenu: () => void;
  navigate: (s: Screen) => void;
  selectedDate: { year: number; month: number; day: number } | null;
  onSave: (key: string, record: LeaveRecord) => void;
}) {
  const [type, setType] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");

  const handleSave = () => {
    if (selectedDate) {
      const key = `${selectedDate.year}-${String(selectedDate.month).padStart(2, "0")}-${String(selectedDate.day).padStart(2, "0")}`;
      onSave(key, { type: type || "有給休暇", date: key });
    }
    navigate("leave-done");
  };

  const dateLabel = selectedDate ? `${selectedDate.month}月${selectedDate.day}日` : "";

  return (
    <div className="bg-[#f4f4f5] flex flex-col min-h-dvh">
      <Header onMenu={onMenu} />
      <div className="flex flex-col gap-[16px] items-start px-[10px] py-[16px] w-full">
        <PageTitle icon={""} title={`休暇申請${dateLabel ? ` (${dateLabel})` : ""}`} />
        <div className="bg-white flex flex-col gap-[16px] items-start p-[20px] w-full rounded-[4px]">
          <FormRow label="登録区分">
            <SelectField value={type} onChange={setType} options={["有給休暇", "特別休暇", "欠勤", "代休"]} />
          </FormRow>
          <FormRow label="始業時間">
            <TimeInput value={start} onChange={setStart} />
          </FormRow>
          <FormRow label="終業時間">
            <TimeInput value={end} onChange={setEnd} />
          </FormRow>
          <FormRow label="昼休憩開始時間">
            <TimeInput value={breakStart} onChange={setBreakStart} />
          </FormRow>
          <FormRow label="昼休憩終了時間">
            <TimeInput value={breakEnd} onChange={setBreakEnd} />
          </FormRow>
        </div>
      </div>
      <div className="flex flex-col gap-[16px] items-center px-[10px] pb-[40px]">
        <PrimaryButton label="申請する" onClick={handleSave} />
        <SecondaryButton label="ホームに戻る" onClick={() => navigate("home")} />
      </div>
    </div>
  );
}

function LeaveDoneScreen({ onMenu, navigate }: { onMenu: () => void; navigate: (s: Screen) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-[#f4f4f5] flex flex-col min-h-dvh">
      <Header onMenu={onMenu} />
      <div className="flex flex-col gap-[16px] items-start px-[10px] py-[16px] w-full">
        <PageTitle icon={""} title="休暇申請" />
        <div className="bg-white flex flex-col gap-[16px] items-start p-[20px] w-full rounded-[4px]">
          <p className="text-[16px] text-black leading-normal" style={{ fontFamily: "'Noto Sans JP:Medium'" }}>
            申請が完了しました。
          </p>
          <button
            onClick={() => setOpen((o) => !o)}
            className="bg-[#f5f5f5] border border-[#d9d9d9] flex items-center justify-between p-[16px] rounded-[8px] w-full cursor-pointer"
          >
            <span className="text-[#1e1e1e] text-[16px] leading-[1.4] whitespace-nowrap" style={{ fontFamily: "'Inter:Semi Bold'" }}>
              申請済み一覧
            </span>
            <img
              src={imgChevronDown}
              alt=""
              className="absolute right-[10px] top-1/2 -translate-y-1/2 size-[16px] pointer-events-none"
            />
          </button>
          {open && (
            <p className="text-[#556b7c] text-[14px] leading-normal pl-[4px]" style={{ fontFamily: "'Noto Sans JP:Regular'" }}>
              申請済みの休暇はありません。
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-[16px] items-center px-[10px] pb-[40px]">
        <SecondaryButton label="ホームに戻る" onClick={() => navigate("home")} />
      </div>
    </div>
  );
}

function UserEditScreen({ onMenu, navigate }: { onMenu: () => void; navigate: (s: Screen) => void }) {
  const [password, setPassword] = useState("");

  return (
    <div className="bg-[#f4f4f5] flex flex-col min-h-dvh">
      <Header onMenu={onMenu} />
      <div className="flex flex-col gap-[16px] items-start px-[10px] py-[16px] w-full">
        <PageTitle icon={""} title="ユーザー編集" />
        <div className="bg-white flex flex-col gap-[16px] items-start p-[20px] w-full rounded-[4px]">
          {[
            { label: "氏名", value: "山田太郎" },
            { label: "部署", value: "システム開発部" },
            { label: "メールアドレス", value: "aaaaa@nexus358.com" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex gap-[16px] items-start text-[16px] text-black leading-normal whitespace-nowrap"
              style={{ fontFamily: "'Noto Sans JP:Medium'" }}
            >
              <span className="min-w-[112px]">{label}</span>
              <span>{value}</span>
            </div>
          ))}
          <div className="flex gap-[10px] items-center">
            <span
              className="text-[#1e1e1e] text-[16px] leading-normal min-w-[112px] whitespace-nowrap"
              style={{ fontFamily: "'Noto Sans JP:Medium'" }}
            >
              パスワード
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="新しいパスワード"
              className="flex-none bg-white border border-[#d9d9d9] rounded-[8px] px-[16px] py-[12px] text-[#1e1e1e] text-[16px] w-[200px]"
              style={{ fontFamily: "'Inter:Regular'" }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[16px] items-center px-[10px] pb-[40px]">
        <PrimaryButton label="登録" onClick={() => navigate("home")} />
        <SecondaryButton label="ホームに戻る" onClick={() => navigate("home")} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Root App
// ────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [workRecords, setWorkRecords] = useState<Record<string, WorkRecord>>({});
  const [leaveRecords, setLeaveRecords] = useState<Record<string, LeaveRecord>>({});
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);

  // パターン登録データを一括管理
  const [patterns, setPatterns] = useState<PatternRecord[]>([]);

  const navigate = (s: Screen) => setScreen(s);

  const saveWork = (key: string, record: WorkRecord) => {
    setWorkRecords((prev) => ({ ...prev, [key]: record }));
  };

  const saveLeave = (key: string, record: LeaveRecord) => {
    setLeaveRecords((prev) => ({ ...prev, [key]: record }));
  };

  // パターン新規追加
  const savePattern = (record: Omit<PatternRecord, "id">) => {
    const newRecord: PatternRecord = { ...record, id: Date.now().toString() };
    setPatterns((prev) => [...prev, newRecord]);
  };

  // パターン更新
  const updatePattern = (updated: PatternRecord) => {
    setPatterns((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // パターン削除
  const deletePattern = (id: string) => {
    setPatterns((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDaySelect = (year: number, month: number, day: number) => {
    setSelectedDate({ year, month, day });
  };

  return (
    <div className="w-full min-h-dvh relative">
      {screen === "login" && <LoginScreen onLogin={() => navigate("home")} />}
      {screen === "home" && (
        <HomeScreen
          onMenu={() => setMenuOpen(true)}
          navigate={navigate}
          workRecords={workRecords}
          leaveRecords={leaveRecords}
          onDaySelect={handleDaySelect}
        />
      )}
      {screen === "worktime" && (
        <WorktimeScreen
          onMenu={() => setMenuOpen(true)}
          navigate={navigate}
          selectedDate={selectedDate}
          onSave={saveWork}
        />
      )}
      {screen === "worktime-pattern" && (
        <WorktimePatternScreen
          onMenu={() => setMenuOpen(true)}
          navigate={navigate}
          onSavePattern={savePattern}
        />
      )}
      {screen === "worktime-pattern-done" && (
        <WorktimePatternDoneScreen
          onMenu={() => setMenuOpen(true)}
          navigate={navigate}
          patterns={patterns}
          onUpdatePattern={updatePattern}
          onDeletePattern={deletePattern}
        />
      )}
      {screen === "leave" && (
        <LeaveScreen
          onMenu={() => setMenuOpen(true)}
          navigate={navigate}
          selectedDate={selectedDate}
          onSave={saveLeave}
        />
      )}
      {screen === "leave-done" && <LeaveDoneScreen onMenu={() => setMenuOpen(true)} navigate={navigate} />}
      {screen === "user-edit" && <UserEditScreen onMenu={() => setMenuOpen(true)} navigate={navigate} />}

      {menuOpen && <MenuOverlay onClose={() => setMenuOpen(false)} navigate={(s) => navigate(s)} />}
    </div>
  );
}