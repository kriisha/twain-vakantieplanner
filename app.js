!function() {
    var e = (window.TWAIN_VAKANTIEPLANNER_API_BASE || "") + "/api/planner",
        t = ["Jens", "Stijn", "Hermann"],
        n = {
            Jens: getComputedStyle(document.documentElement).getPropertyValue("--jens").trim(),
            Stijn: getComputedStyle(document.documentElement).getPropertyValue("--stijn").trim(),
            Hermann: getComputedStyle(document.documentElement).getPropertyValue("--hermann").trim()
        },
        r = {
            vacation: "Vakantie",
            home: "Thuiswerk"
        },
        a = {
            entries: [],
            currentUser: window.localStorage.getItem("twain-vakantieplanner-user") || "",
            selectedType: "vacation",
            filterPerson: "all",
            currentMonth: h(new Date()),
            selectedDates: [],
            loading: !1,
            saving: !1,
            error: "",
            lastSyncedAt: null,
            syncPausedUntil: 0
        },
        i = {
            note: document.getElementById("note-input"),
            saveBtn: document.getElementById("save-btn"),
            clearSelectionBtn: document.getElementById("clear-selection-btn"),
            refreshBtn: document.getElementById("refresh-btn"),
            prevMonth: document.getElementById("prev-month-btn"),
            nextMonth: document.getElementById("next-month-btn"),
            todayBtn: document.getElementById("today-btn"),
            monthTitle: document.getElementById("month-title"),
            calendarGrid: document.getElementById("calendar-grid"),
            heroStats: document.getElementById("hero-stats"),
            currentUserName: document.getElementById("current-user-name"),
            currentUserSub: document.getElementById("current-user-sub"),
            userPills: document.getElementById("user-pills"),
            switchUserBtn: document.getElementById("switch-user-btn"),
            identityModal: document.getElementById("identity-modal"),
            identityModalPills: document.getElementById("identity-modal-pills"),
            filterPills: document.getElementById("filter-pills"),
            selectionRange: document.getElementById("selection-range"),
            selectionSub: document.getElementById("selection-sub"),
            syncDot: document.getElementById("sync-dot"),
            syncLabel: document.getElementById("sync-label"),
            errorBanner: document.getElementById("error-banner")
        };

    function o() {
        var e, o, s, l, c, u, g;
        !function() {
            if (!a.error) return i.errorBanner.style.display = "none", void(i.errorBanner.textContent = "");
            i.errorBanner.style.display = "block", i.errorBanner.textContent = a.error;
        }();

        !function() {
            var e = Boolean(a.error);
            if (i.syncDot.classList.toggle("error", e), e) return void(i.syncLabel.textContent = "Backend niet bereikbaar");
            if (a.loading) return void(i.syncLabel.textContent = "Planning synchroniseren...");
            if (!a.lastSyncedAt) return void(i.syncLabel.textContent = "Verbonden met gedeelde planning");
            i.syncLabel.textContent = "Laatst ververst om " + a.lastSyncedAt.toLocaleTimeString("nl-BE", {
                hour: "2-digit",
                minute: "2-digit"
            });
        }();

        e = a.currentUser || "Kies uw naam";
        i.currentUserName.textContent = e;
        i.currentUserSub.textContent = a.currentUser ? "Registraties toevoegen en uw eigen maanditems verwijderen gebeurt voor " + a.currentUser + "." : "Kies eerst wie de planner gebruikt.";

        !function() {
            var e, t;
            if (!a.currentUser) return i.selectionRange.textContent = "Kies eerst uw naam", void(i.selectionSub.textContent = "Daarna kunt u dagen aanduiden voor vakantie of thuiswerk.");
            if (!a.selectedDates.length) return i.selectionRange.textContent = "Klik dagen in de kalender", void(i.selectionSub.textContent = "Elke klik zet een dag aan of uit.");
            e = a.selectedDates.slice().sort();
            i.selectionRange.textContent = 1 === e.length ? (t = e[0], D(t).toLocaleDateString("nl-BE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            })) : e.length + " dagen geselecteerd";
            i.selectionSub.textContent = e.join(", ");
        }();

        o = v(a.currentMonth);
        s = o.reduce(function(e, t) {
            return e + f(t, a.currentMonth);
        }, 0);
        l = a.currentUser ? o.filter(function(e) {
            return e.person === a.currentUser;
        }) : [];
        c = l.filter(function(e) {
            return "vacation" === e.type;
        }).reduce(function(e, t) {
            return e + f(t, a.currentMonth);
        }, 0);
        u = l.filter(function(e) {
            return "home" === e.type;
        }).reduce(function(e, t) {
            return e + f(t, a.currentMonth);
        }, 0);

        i.heroStats.innerHTML = '<div class="hero-stat"><div class="hero-stat-label">Team totaal</div><div class="hero-stat-value">' + s + '</div><div class="hero-stat-sub">Geplande dagen deze maand</div></div><div class="hero-stat"><div class="hero-stat-label">' + L(a.currentUser || "Mijn") + ' vakantie</div><div class="hero-stat-value">' + c + '</div><div class="hero-stat-sub">Vakantiedagen deze maand</div></div><div class="hero-stat"><div class="hero-stat-label">' + L(a.currentUser || "Mijn") + ' thuiswerk</div><div class="hero-stat-value">' + u + '</div><div class="hero-stat-sub">Thuiswerkdagen deze maand</div></div>';
        i.monthTitle.textContent = a.currentMonth.toLocaleDateString("nl-BE", {
            month: "long",
            year: "numeric"
        });

        !function() {
            var e = h(a.currentMonth),
                t = b(a.currentMonth),
                n,
                o,
                s,
                l,
                c,
                u,
                g,
                v,
                f,
                E,
                N;

            i.calendarGrid.innerHTML = "";
            ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].forEach(function(e) {
                var t = document.createElement("div");
                t.className = "weekday";
                t.textContent = e;
                i.calendarGrid.appendChild(t);
            });

            n = function(e) {
                var t = new Date(e),
                    n = t.getDay(),
                    r = 0 === n ? -6 : 1 - n;
                t.setDate(t.getDate() + r);
                t.setHours(0, 0, 0, 0);
                return t;
            }(e);
            o = function(e) {
                var t = new Date(e),
                    n = t.getDay(),
                    r = 0 === n ? 0 : 7 - n;
                t.setDate(t.getDate() + r);
                t.setHours(0, 0, 0, 0);
                return t;
            }(t);
            s = S(w(n), w(o)) + 1;

            for (l = 0; l < s; l += 1) {
                c = k(n, l);
                u = w(c);
                g = c.getMonth() === a.currentMonth.getMonth();
                v = y(u);
                f = p(u);
                E = document.createElement("div");
                E.className = "day" + (g ? "" : " outside") + (B(c) ? " today" : "") + (f ? " selected" : "");
                E.setAttribute("role", "button");
                E.setAttribute("tabindex", "0");
                E.setAttribute("data-iso", u);
                E.addEventListener("click", d.bind(null, u));
                E.addEventListener("keydown", function(e) {
                    if ("Enter" === e.key || " " === e.key) {
                        e.preventDefault();
                        d(e.currentTarget.getAttribute("data-iso"));
                    }
                });

                N = v.length ? v.map(function(e) {
                    var t = e.person === a.currentUser ? '<button class="entry-remove" type="button" data-remove-entry="' + e.id + '">Verwijderen</button>' : "";
                    return '<div class="entry-pill ' + e.type + '"><span class="entry-name">' + e.person + '</span><span class="entry-type">' + r[e.type] + "</span>" + t + "</div>";
                }).join("") : "";

                E.innerHTML = '<div class="day-head"><span class="day-number">' + c.getDate() + '</span><span class="day-select">' + (f ? "Gekozen" : "Kies") + '</span></div><div class="day-tags">' + N + "</div>";
                E.querySelectorAll("[data-remove-entry]").forEach(function(e) {
                    e.addEventListener("click", function(t) {
                        t.stopPropagation();
                        m(e.getAttribute("data-remove-entry"));
                    });
                });
                i.calendarGrid.appendChild(E);
            }
        }();

        g = a.currentUser && a.selectedDates.length > 0;
        i.saveBtn.disabled = !g || a.saving || a.loading;
        i.clearSelectionBtn.disabled = !g;
        i.refreshBtn.disabled = a.loading;
    }

    function s() {
        l(i.userPills, !1);
        l(i.identityModalPills, !0);
    }

    function l(e, n) {
        e.innerHTML = "";
        t.forEach(function(t) {
            var r = document.createElement("button");
            r.type = "button";
            r.className = "user-pill" + (t === a.currentUser ? " active" : "");
            r.textContent = t;
            r.addEventListener("click", function() {
                !function(e) {
                    a.currentUser = e;
                    window.localStorage.setItem("twain-vakantieplanner-user", e);
                    a.selectedDates = [];
                    s();
                    o();
                }(t);
                n && i.identityModal.classList.remove("open");
            });
            e.appendChild(r);
        });
    }

    function c() {
        i.identityModal.classList.add("open");
    }

    function d(e) {
        var t;
        if (!a.currentUser) return void c();
        t = a.selectedDates.indexOf(e);
        t > -1 ? a.selectedDates.splice(t, 1) : a.selectedDates.push(e);
        a.selectedDates.sort();
        o();
    }

    function u() {
        a.selectedDates = [];
        o();
    }

    async function m(t) {
        if (!t || !window.confirm("Wilt u deze registratie verwijderen?")) return;
        a.loading = !0;
        o();

        try {
            var n = a.entries.filter(function(e) {
                    return e.id !== t;
                }),
                r = await M(e, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        action: "replace",
                        entries: n
                    })
                });
            a.entries = Array.isArray(r.entries) ? r.entries : n;
            a.lastSyncedAt = new Date();
            a.syncPausedUntil = Date.now() + 2e4;
            a.error = "";
        } catch (e) {
            a.error = e && e.message ? "Verwijderen is niet gelukt: " + e.message : "Verwijderen is niet gelukt. Probeer zo meteen opnieuw.";
        } finally {
            a.loading = !1;
            o();
        }
    }

    async function g(t) {
        a.loading = !0;
        o();

        try {
            var n = await M(e, {
                    method: "GET"
                }),
                r = Array.isArray(n.entries) ? n.entries : [];

            a.entries = function(e) {
                var n, r;
                if (Date.now() >= a.syncPausedUntil) return e;
                if (e.length !== a.entries.length) return a.entries;
                n = new Set(a.entries.map(function(e) {
                    return e.id;
                }));
                for (r = 0; r < e.length; r += 1) {
                    if (!n.has(e[r].id)) return a.entries;
                }
                return e;
            }(r);

            a.lastSyncedAt = new Date();
            a.error = "";
        } catch (e) {
            if (t) {
                a.error = e && e.message ? "De gedeelde planner kan de backend niet bereiken: " + e.message : "De gedeelde planner kan de backend niet bereiken. Deploy deze map op Vercel en koppel een private Blob store om hem team-breed te gebruiken.";
            }
        } finally {
            a.loading = !1;
            o();
        }
    }

    function y(e) {
        return a.entries.filter(function(t) {
            return ("all" === a.filterPerson || t.person === a.filterPerson) && e >= t.start && e <= t.end;
        }).sort(function(e, n) {
            return e.person !== n.person ? t.indexOf(e.person) - t.indexOf(n.person) : e.type.localeCompare(n.type);
        });
    }

    function v(e) {
        var t = h(e),
            n = b(e);
        return a.entries.filter(function(e) {
            return ("all" === a.filterPerson || e.person === a.filterPerson) && e.end >= w(t) && e.start <= w(n);
        });
    }

    function f(e, t) {
        var n = w(h(t)),
            r = w(b(t)),
            a = e.start > n ? e.start : n,
            i = e.end < r ? e.end : r;
        return i < a ? 0 : S(a, i) + 1;
    }

    function p(e) {
        return a.selectedDates.indexOf(e) > -1;
    }

    function h(e) {
        return new Date(e.getFullYear(), e.getMonth(), 1);
    }

    function b(e) {
        return new Date(e.getFullYear(), e.getMonth() + 1, 0);
    }

    function E(e, t) {
        return new Date(e.getFullYear(), e.getMonth() + t, 1);
    }

    function k(e, t) {
        var n = new Date(e);
        n.setDate(n.getDate() + t);
        return n;
    }

    function w(e) {
        return e.getFullYear() + "-" + String(e.getMonth() + 1).padStart(2, "0") + "-" + String(e.getDate()).padStart(2, "0");
    }

    function B(e) {
        return w(e) === w(new Date());
    }

    function D(e) {
        var t = e.split("-").map(Number);
        return new Date(t[0], t[1] - 1, t[2]);
    }

    function S(e, t) {
        var n = D(e),
            r = D(t);
        return Math.round((r - n) / 864e5);
    }

    async function M(e, t) {
        var n = await fetch(e, t || {}),
            r = await n.text(),
            a = {};

        if (r) {
            try {
                a = JSON.parse(r);
            } catch (e) {
                a = {
                    error: r
                };
            }
        }

        if (!n.ok) throw new Error(a && a.error ? a.error : "Request failed");
        return a;
    }

    function L(e) {
        return String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function P() {
        return window.crypto && "function" == typeof window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
    }

    function T(e) {
        var n = [],
            r = new Set;
        return e.forEach(function(e) {
            var a;
            e && e.id && (a = [e.person, e.type, e.start, e.end, e.note || ""].join("|"), !r.has(a)) && (r.add(a), n.push({
                id: e.id,
                person: e.person,
                type: e.type,
                start: e.start,
                end: e.end,
                note: e.note || "",
                createdAt: e.createdAt || (new Date).toISOString()
            }));
        }), n.sort(function(e, n) {
            return e.start !== n.start ? e.start.localeCompare(n.start) : e.person !== n.person ? t.indexOf(e.person) - t.indexOf(n.person) : (e.createdAt || "").localeCompare(n.createdAt || "");
        });
    }

    document.querySelectorAll(".segment").forEach(function(e) {
        e.addEventListener("click", function() {
            a.selectedType = e.getAttribute("data-type");
            document.querySelectorAll(".segment").forEach(function(t) {
                t.classList.toggle("active", t === e);
            });
        });
    });

    i.saveBtn.addEventListener("click", async function() {
        if (!a.currentUser) return void c();
        if (!a.selectedDates.length) return void window.alert("Kies eerst één of meerdere dagen in de kalender.");

        a.saving = !0;
        o();

        try {
            var t = (i.note.value || "").trim(),
                n = a.selectedDates.map(function(e) {
                    return {
                        id: P(),
                        person: a.currentUser,
                        type: a.selectedType,
                        start: e,
                        end: e,
                        note: t,
                        createdAt: (new Date).toISOString()
                    };
                }),
                r = T(a.entries.concat(n)),
                s = await M(e, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        action: "replace",
                        entries: r
                    })
                });

            a.entries = Array.isArray(s.entries) ? s.entries : r;
            a.lastSyncedAt = new Date();
            a.syncPausedUntil = Date.now() + 2e4;
            a.error = "";
            i.note.value = "";
            u();
        } catch (e) {
            a.error = e && e.message ? "Opslaan is niet gelukt: " + e.message : "Opslaan is niet gelukt. Controleer of de Vercel backend en Blob store correct geconfigureerd zijn.";
            o();
        } finally {
            a.saving = !1;
            o();
        }
    });

    i.clearSelectionBtn.addEventListener("click", u);
    i.refreshBtn.addEventListener("click", function() {
        g(!0);
    });
    i.switchUserBtn.addEventListener("click", function() {
        c();
    });
    i.prevMonth.addEventListener("click", function() {
        a.currentMonth = E(a.currentMonth, -1);
        o();
    });
    i.nextMonth.addEventListener("click", function() {
        a.currentMonth = E(a.currentMonth, 1);
        o();
    });
    i.todayBtn.addEventListener("click", function() {
        a.currentMonth = h(new Date());
        o();
    });

    s();

    !function e() {
        var n = ["all"].concat(t);
        i.filterPills.innerHTML = "";
        n.forEach(function(t) {
            var n = document.createElement("button");
            n.type = "button";
            n.className = "pill" + (t === a.filterPerson ? " active" : "");
            n.textContent = "all" === t ? "Iedereen" : t;
            n.addEventListener("click", function() {
                a.filterPerson = t;
                e();
                o();
            });
            i.filterPills.appendChild(n);
        });
    }();

    o();
    g(!0);
    t.includes(a.currentUser) || c();
    window.setInterval(function() {
        g(!1);
    }, 3e4);
}();
