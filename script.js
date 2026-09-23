// Nomad Anarchy - script.js

// --- discord widget ---
const SHOW_MEMBERS = true;
const WIDGET_URL = 'https://discord.com/api/guilds/1540938382400692325/widget.json';
const FALLBACK_INVITE = 'https://discord.gg/h6pY6gg5WC';

const STATUS_COLORS = {
    online: '#3ba55d',
    idle:   '#faa61a',
    dnd:    '#ed4245'
};

function renderWidget(container, data) {
    while (container.firstChild) container.removeChild(container.firstChild);

    var name = data.name || 'Nomad Anarchy';
    var invite = data.instant_invite || FALLBACK_INVITE;
    var online = (typeof data.presence_count === 'number') ? data.presence_count : 0;

    var nameLink = document.createElement('a');
    nameLink.href = invite;
    nameLink.rel = 'noopener';
    nameLink.target = '_blank';
    nameLink.textContent = name;
    nameLink.style.fontWeight = 'bold';
    nameLink.style.display = 'block';
    container.appendChild(nameLink);

    var countLine = document.createElement('p');
    countLine.textContent = online + ' online';
    countLine.style.margin = '2px 0 6px 0';
    container.appendChild(countLine);

    if (!SHOW_MEMBERS || !data.members) return;

    var list = document.createElement('div');
    list.className = 'widget-list';
    var order = { online: 0, idle: 1, dnd: 2, offline: 3 };
    function rank(s) {
        return Object.prototype.hasOwnProperty.call(order, s) ? order[s] : 4;
    }
    var members = data.members.slice().sort(function (a, b) {
        var ao = rank(a.status);
        var bo = rank(b.status);
        if (ao !== bo) return ao - bo;
        return (a.username || '').localeCompare(b.username || '');
    });
    for (var i = 0; i < members.length; i++) {
        var m = members[i];
        if (!m || m.status === 'offline') continue;
        var row = document.createElement('div');
        row.className = 'widget-row';

        var img = document.createElement('img');
        img.className = 'widget-avatar';
        img.src = m.avatar_url || '';
        img.alt = '';
        img.width = 20;
        img.height = 20;
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        row.appendChild(img);

        var status = document.createElement('span');
        status.className = 'widget-status';
        var color = STATUS_COLORS[m.status];
        if (color) status.style.backgroundColor = color;
        row.appendChild(status);

        var uname = document.createElement('span');
        uname.className = 'widget-name';
        uname.textContent = m.username || '';
        row.appendChild(uname);

        list.appendChild(row);
    }
    container.appendChild(list);
}

function renderWidgetError(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
    var p = document.createElement('p');
    p.textContent = 'member list unavailable';
    p.style.margin = '0 0 4px 0';
    container.appendChild(p);
    var a = document.createElement('a');
    a.href = FALLBACK_INVITE;
    a.rel = 'noopener';
    a.target = '_blank';
    a.textContent = 'join on discord';
    container.appendChild(a);
}

function loadWidget() {
    var containers = document.getElementsByClassName('discord-widget');
    if (!containers.length) return;

    for (var i = 0; i < containers.length; i++) {
        containers[i].textContent = 'loading discord members';
    }

    var controller;
    var timeoutId;
    if (typeof AbortController !== 'undefined') {
        controller = new AbortController();
        timeoutId = setTimeout(function () {
            try { controller.abort(); } catch (e) { /* ignore */ }
        }, 6000);
    }

    var opts = { credentials: 'omit' };
    if (controller) opts.signal = controller.signal;

    var finish = function (ok, data) {
        if (timeoutId) clearTimeout(timeoutId);
        for (var i = 0; i < containers.length; i++) {
            if (ok) {
                renderWidget(containers[i], data);
            } else {
                renderWidgetError(containers[i]);
            }
        }
    };

    try {
        if (typeof fetch !== 'function') {
            finish(false, null);
            return;
        }
        fetch(WIDGET_URL, opts).then(function (resp) {
            if (!resp || !resp.ok) { finish(false, null); return; }
            return resp.json().then(function (data) { finish(true, data); }, function () { finish(false, null); });
        }, function () { finish(false, null); }).catch(function () { finish(false, null); });
    } catch (e) {
        finish(false, null);
    }
}

// --- theme toggle ---
document.addEventListener('DOMContentLoaded', function () {
    var toggleBtn = document.getElementById('theme-btn');
    function setTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', t === 'dark' ? '#1a1a1a' : '#f4f0e4');
        try { localStorage.setItem('theme', t); } catch (e) { /* ignore */ }
        updateButton(t);
    }
    function updateButton(t) {
        if (!toggleBtn) return;
        var next = t === 'dark' ? 'light' : 'dark';
        toggleBtn.setAttribute('aria-label', 'switch to ' + next + ' mode');
        toggleBtn.setAttribute('title', 'switch to ' + next + ' mode');
        if (t === 'dark') {
            // sun icon
            toggleBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="2.9" y1="2.9" x2="4.3" y2="4.3"/><line x1="11.7" y1="11.7" x2="13.1" y2="13.1"/><line x1="2.9" y1="13.1" x2="4.3" y2="11.7"/><line x1="11.7" y1="4.3" x2="13.1" y2="2.9"/></svg>';
        } else {
            // moon icon (crescent opening to the right)
            toggleBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.5 2.2A6 6 0 1 0 7.5 13.8A6 6 0 0 1 7.5 2.2z"/></svg>';
        }
    }
    if (toggleBtn) {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        updateButton(current);
        function warmOtherBackground() {
            toggleBtn.removeEventListener('mouseenter', warmOtherBackground);
            toggleBtn.removeEventListener('focus', warmOtherBackground);
            toggleBtn.removeEventListener('touchstart', warmOtherBackground);
            var theme = document.documentElement.getAttribute('data-theme') || 'light';
            var img = new Image();
            img.src = theme === 'dark' ? '/bg-light.jpg' : '/bg-dark.jpg';
        }
        toggleBtn.addEventListener('mouseenter', warmOtherBackground);
        toggleBtn.addEventListener('focus', warmOtherBackground);
        toggleBtn.addEventListener('touchstart', warmOtherBackground, { passive: true });
        toggleBtn.addEventListener('click', function () {
            var now = document.documentElement.getAttribute('data-theme') || 'light';
            setTheme(now === 'dark' ? 'light' : 'dark');
        });
    }

    loadWidget();
});
