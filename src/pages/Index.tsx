import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/e61b2b00-624b-43b8-923a-2dcb04f82da2";

type AuthMode = "login" | "register";
type User = { id: number; name: string; email: string } | null;

const AuthModal = ({ mode, onClose, onSuccess }: { mode: AuthMode; onClose: () => void; onSuccess: (u: User) => void }) => {
  const [tab, setTab] = useState<AuthMode>(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const body = tab === "register" ? { action: "register", name, email, password } : { action: "login", email, password };
      const res = await fetch(AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = JSON.parse(await res.text());
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      localStorage.setItem("uptime_user", JSON.stringify(data));
      onSuccess(data);
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-accent/20 rounded-2xl p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 text-muted-foreground hover:text-white" onClick={onClose}>
          <Icon name="X" size={20} />
        </button>
        <div className="flex items-center gap-2 mb-6">
          <Icon name="MessageSquare" size={20} className="text-accent" />
          <span className="font-bold text-lg">UPTIME</span>
        </div>
        <div className="flex gap-1 mb-6 bg-accent/5 border border-accent/10 rounded-xl p-1">
          {(["login", "register"] as AuthMode[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? "bg-accent text-black" : "text-muted-foreground hover:text-white"}`}>
              {t === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {tab === "register" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя"
              className="w-full bg-accent/5 border border-accent/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent/40 transition-colors" />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
            className="w-full bg-accent/5 border border-accent/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent/40 transition-colors" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" type="password"
            onKeyDown={e => e.key === "Enter" && submit()}
            className="w-full bg-accent/5 border border-accent/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent/40 transition-colors" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-accent to-accent/80 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50">
            {loading ? "Загрузка..." : tab === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const [authModal, setAuthModal] = useState<AuthMode | null>(null);
  const [user, setUser] = useState<User>(() => {
    try { return JSON.parse(localStorage.getItem("uptime_user") || "null"); } catch { return null; }
  });

  useEffect(() => {
    const observers: Record<string, IntersectionObserver> = {};

    const sectionIds = ["hero", "features", "how", "pricing", "cta"];

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      observers[id] = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [id]: true }));
            observers[id].unobserve(element);
          }
        },
        { threshold: 0.15 }
      );

      observers[id].observe(element);
    });

    return () => {
      Object.values(observers).forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={(u) => { setUser(u); setAuthModal(null); }}
        />
      )}
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-2xl border-b border-accent/20 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon name="MessageSquare" size={24} className="text-accent" />
            <div className="font-display font-bold text-2xl tracking-tighter bg-gradient-to-r from-white via-accent to-accent/80 bg-clip-text text-transparent">
              UPTIME
            </div>
          </div>
          <nav className="hidden md:flex gap-10 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-white transition-colors">
              Возможности
            </a>
            <a href="#how" className="text-muted-foreground hover:text-white transition-colors">
              Как это работает
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-white transition-colors">
              Тарифы
            </a>
          </nav>
          <div className="flex gap-3 items-center">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/70">Привет, <span className="text-white font-medium">{user.name}</span></span>
                <button onClick={() => { localStorage.removeItem("uptime_user"); setUser(null); }}
                  className="px-4 py-2 text-sm font-medium border border-accent/40 rounded-full hover:border-accent/70 hover:bg-accent/10 transition-all">
                  Выйти
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setAuthModal("login")} className="px-5 py-2.5 text-sm font-medium border border-accent/40 rounded-full hover:border-accent/70 hover:bg-accent/10 transition-all">
                  Войти
                </button>
                <button onClick={() => setAuthModal("register")} className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-accent via-accent to-accent/80 text-black rounded-full hover:shadow-lg hover:shadow-accent/40 transition-all font-semibold">
                  Регистрация
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-32 px-6 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
          <img src="/images/black-hole-gif.gif" alt="Background animation" className="w-auto h-3/4 object-contain" />
        </div>
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div
              className={`transition-all duration-1000 ${visibleSections["hero"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="mb-8 inline-block">
                <span className="text-xs font-medium tracking-widest text-accent/80 uppercase">
                  Мессенджер для команд нового поколения
                </span>
              </div>
              <h1 className="text-6xl lg:text-7xl font-display font-black leading-tight mb-8 tracking-tighter">
                <span className="bg-gradient-to-br from-white via-white to-accent/40 bg-clip-text text-transparent">
                  Общайся. Решай.
                </span>
                <br />
                <span className="text-accent">Побеждай.</span>
              </h1>
              <p className="text-xl text-white/80 leading-relaxed mb-10 max-w-xl font-light">
                UPTIME — мессенджер, созданный для командной работы. Каналы, задачи, файлы и интеграции в одном месте. Никаких лишних инструментов.
              </p>
              <div className="flex gap-4 mb-12 flex-col sm:flex-row">
                <button onClick={() => setAuthModal("register")} className="group px-8 py-4 bg-gradient-to-r from-accent to-accent/90 text-black rounded-full hover:shadow-2xl hover:shadow-accent/50 transition-all font-semibold text-lg flex items-center gap-3 justify-center">
                  Регистрация
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button onClick={() => setAuthModal("login")} className="px-8 py-4 border border-accent/40 rounded-full hover:border-accent/70 hover:bg-accent/10 transition-all font-medium text-lg text-white">
                  Войти
                </button>
              </div>
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                <div>
                  <div className="text-2xl font-bold text-accent mb-2">50 000+</div>
                  <p className="text-sm text-white/60">Активных команд</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white mb-2">2 млн+</div>
                  <p className="text-sm text-white/60">Сообщений в день</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent mb-2">99.99%</div>
                  <p className="text-sm text-white/60">Аптайм</p>
                </div>
              </div>
            </div>

            <div
              className={`relative h-96 lg:h-[550px] transition-all duration-1000 flex items-center justify-center ${visibleSections["hero"] ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-transparent to-transparent rounded-3xl blur-3xl animate-pulse" />
              <div className="relative z-10 w-full max-w-sm lg:max-w-md">
                <div className="bg-card/80 border border-accent/20 rounded-2xl p-4 backdrop-blur-sm shadow-2xl">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-accent/10">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <Icon name="Hash" size={16} className="text-accent" />
                    </div>
                    <span className="font-semibold text-white">general</span>
                    <span className="ml-auto text-xs text-accent/60">онлайн: 12</span>
                  </div>
                  {[
                    { user: "Алёна", msg: "Обновила дизайн главной страницы 🎨", time: "10:42" },
                    { user: "Максим", msg: "Отлично! Жду в ревью", time: "10:44" },
                    { user: "Вы", msg: "Уже смотрю, выглядит 🔥", time: "10:45" },
                  ].map((m, i) => (
                    <div key={i} className="flex gap-3 mb-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex-shrink-0 flex items-center justify-center text-xs font-bold text-accent">
                        {m.user[0]}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-white">{m.user}</span>
                          <span className="text-xs text-white/30">{m.time}</span>
                        </div>
                        <p className="text-sm text-white/70">{m.msg}</p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 flex items-center gap-2 bg-accent/5 border border-accent/10 rounded-xl px-3 py-2">
                    <Icon name="Smile" size={16} className="text-accent/40" />
                    <span className="text-sm text-white/30 flex-1">Написать сообщение...</span>
                    <Icon name="Send" size={16} className="text-accent/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-accent/5">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${visibleSections["features"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <span className="text-xs font-medium tracking-widest text-accent/60 uppercase">Возможности</span>
            <h2 className="text-5xl lg:text-6xl font-display font-black tracking-tighter mt-4 mb-6">
              <span className="bg-gradient-to-r from-white via-white to-accent/40 bg-clip-text text-transparent">
                Всё для вашей команды
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "Hash",
                title: "Каналы и треды",
                desc: "Организуйте общение по темам, проектам и отделам. Никакого хаоса.",
              },
              {
                icon: "CheckSquare",
                title: "Задачи внутри чата",
                desc: "Создавайте задачи прямо из сообщений и назначайте ответственных.",
              },
              {
                icon: "Video",
                title: "Видеозвонки",
                desc: "HD-звонки и экрано-шаринг в один клик, без сторонних сервисов.",
              },
              {
                icon: "Lock",
                title: "Безопасность данных",
                desc: "Сквозное шифрование, контроль доступа и соответствие GDPR.",
              },
              {
                icon: "Puzzle",
                title: "Интеграции",
                desc: "Подключайте GitHub, Jira, Google Drive и сотни других инструментов.",
              },
              {
                icon: "Search",
                title: "Умный поиск",
                desc: "Мгновенно находите любые сообщения, файлы и задачи по всей истории.",
              },
            ].map((item, i) => {
              const isVisible = visibleSections["features"];
              return (
                <div
                  key={i}
                  className={`group p-8 border border-accent/10 hover:border-accent/40 rounded-2xl bg-card/50 hover:bg-card/80 transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                    <Icon name={item.icon} size={22} className="text-accent" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${visibleSections["how"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <span className="text-xs font-medium tracking-widest text-accent/60 uppercase">Процесс</span>
            <h2 className="text-5xl lg:text-6xl font-display font-black tracking-tighter mt-4">
              <span className="bg-gradient-to-r from-white via-white to-accent/40 bg-clip-text text-transparent">
                Запуск за 4 шага
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "01", title: "Создайте команду", desc: "Зарегистрируйтесь и создайте рабочее пространство за 2 минуты" },
              { num: "02", title: "Пригласите коллег", desc: "Добавьте участников по email или ссылке-приглашению" },
              { num: "03", title: "Настройте каналы", desc: "Создайте каналы по проектам и отделам, настройте доступы" },
              { num: "04", title: "Работайте вместе", desc: "Общайтесь, ставьте задачи и достигайте результатов быстрее" },
            ].map((step, i) => {
              const isVisible = visibleSections["how"];
              return (
                <div
                  key={i}
                  className={`relative transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <div className="group bg-accent/10 hover:bg-accent/20 border border-accent/20 hover:border-accent/40 rounded-2xl p-8 h-full flex flex-col justify-between transition-all backdrop-blur-sm cursor-pointer">
                    <div>
                      <div className="text-5xl font-display font-black text-accent mb-4 group-hover:scale-110 transition-transform">
                        {step.num}
                      </div>
                      <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-accent/40 to-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${visibleSections["pricing"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <span className="text-xs font-medium tracking-widest text-accent/60 uppercase">Тарифы</span>
            <h2 className="text-5xl lg:text-6xl font-display font-black tracking-tighter mt-4">
              <span className="bg-gradient-to-r from-white via-white to-accent/40 bg-clip-text text-transparent">
                Простые цены
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: "Для команды",
                price: "990 ₽/мес",
                sub: "за пользователя",
                features: [
                  "До 50 участников",
                  "Неограниченные каналы",
                  "История сообщений 1 год",
                  "10 ГБ хранилища",
                  "Видеозвонки до 10 человек",
                  "Базовые интеграции",
                ],
                highlight: false,
              },
              {
                name: "Корпоративный",
                price: "По запросу",
                sub: "индивидуальные условия",
                features: [
                  "Безлимитное количество участников",
                  "Безлимитная история сообщений",
                  "Безлимитное хранилище",
                  "Видеозвонки до 100 человек",
                  "Все интеграции + API",
                  "Поддержка 24/7 + выделенный менеджер",
                ],
                highlight: true,
              },
            ].map((plan, i) => {
              const isVisible = visibleSections["pricing"];
              return (
                <div
                  key={i}
                  className={`group relative transition-all duration-700 ${
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  } ${plan.highlight ? "md:scale-105" : ""}`}
                  style={{ transitionDelay: `${i * 200}ms` }}
                >
                  {plan.highlight && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent via-accent to-accent/60 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition" />
                  )}
                  <div
                    className={`relative p-10 border rounded-2xl h-full flex flex-col justify-between backdrop-blur-sm transition-all ${
                      plan.highlight ? "border-accent/40 bg-accent/10" : "border-accent/10 bg-card/50 hover:bg-card/80"
                    }`}
                  >
                    <div>
                      <h3 className="font-display font-bold text-2xl mb-1">{plan.name}</h3>
                      <p className="text-4xl font-black text-accent mb-1">{plan.price}</p>
                      <p className="text-sm text-muted-foreground mb-8">{plan.sub}</p>
                      <ul className="space-y-4 mb-10">
                        {plan.features.map((f, j) => (
                          <li key={j} className="flex gap-3 text-sm items-start">
                            <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                            <span className="text-foreground/80">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => !plan.highlight && setAuthModal("register")}
                      className={`w-full px-6 py-4 rounded-xl font-semibold transition-all ${
                        plan.highlight
                          ? "bg-gradient-to-r from-accent to-accent/80 text-black hover:shadow-xl hover:shadow-accent/40"
                          : "border border-accent/20 hover:border-accent/40 hover:bg-accent/5"
                      }`}
                    >
                      {plan.highlight ? "Связаться с нами" : "Регистрация"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-32 px-6">
        <div
          className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${visibleSections["cta"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-5xl lg:text-6xl font-display font-black tracking-tighter mb-6">
            <span className="bg-gradient-to-r from-white via-white to-accent/40 bg-clip-text text-transparent">
              Ваша команда заслуживает лучшего
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 font-light max-w-2xl mx-auto">
            Присоединяйтесь к тысячам команд, которые работают эффективнее с UPTIME. Первые 14 дней бесплатно.
          </p>
          <button onClick={() => setAuthModal("register")} className="group px-10 py-5 bg-gradient-to-r from-accent to-accent/90 text-black rounded-full hover:shadow-2xl hover:shadow-accent/40 transition-all font-bold text-lg flex items-center gap-3 mx-auto">
            Регистрация
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-accent/10 py-12 px-6 bg-background/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Icon name="MessageSquare" size={16} className="text-accent" />
            <p>© 2025 UPTIME — Мессенджер для командной работы</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">
              Конфиденциальность
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Условия
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Документация
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Контакты
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;