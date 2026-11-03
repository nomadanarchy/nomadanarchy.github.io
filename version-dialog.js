(function () {
    var table = document.getElementById('downloads-table');
    var dialog = document.getElementById('version-dialog');
    if (!table || !dialog || typeof dialog.showModal !== 'function') { return; }

    var mcLabel = document.getElementById('version-dialog-mc');
    var list = document.getElementById('version-dialog-options');

    table.addEventListener('click', function (e) {
        var a = e.target.closest('a');
        if (!a || !table.contains(a)) { return; }
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) { return; }

        var sources = [];
        if (a.dataset.modrinth) { sources.push({ label: 'Modrinth', url: a.dataset.modrinth, external: true }); }
        if (a.dataset.curseforge) { sources.push({ label: 'CurseForge', url: a.dataset.curseforge, external: true }); }
        sources.push({ label: 'GitHub', url: a.href, external: false });

        // only GitHub exists for this version, so download directly
        if (sources.length === 1) { return; }

        e.preventDefault();
        mcLabel.textContent = a.textContent.trim();
        list.textContent = '';
        sources.forEach(function (s) {
            var li = document.createElement('li');
            var link = document.createElement('a');
            link.href = s.url;
            link.textContent = s.label;
            link.rel = 'noopener';
            if (s.external) { link.target = '_blank'; }
            link.addEventListener('click', function () { dialog.close(); });
            li.appendChild(link);
            list.appendChild(li);
        });
        dialog.showModal();
    });

    document.getElementById('version-dialog-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) { dialog.close(); } });
})();