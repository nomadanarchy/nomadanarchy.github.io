(function () {
    'use strict';

    var table = document.getElementById('downloads-table');
    var dialog = document.getElementById('version-dialog');
    var mcLabel = document.getElementById('version-dialog-mc');
    var options = document.getElementById('version-dialog-options');
    var closeButton = document.getElementById('version-dialog-close');

    if (!table || !dialog || !mcLabel || !options || !closeButton) {
        return;
    }

    function closeDialog() {
        if (dialog.open) {
            dialog.close();
        }
    }

    table.addEventListener('click', function (event) {
        var target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        var downloadLink = target.closest('a.version-link');

        if (!downloadLink || !table.contains(downloadLink)) {
            return;
        }

        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        var sources = [];

        if (downloadLink.dataset.curseforge) {
            sources.push({
                label: 'CurseForge',
                url: downloadLink.dataset.curseforge
            });
        }

        if (downloadLink.dataset.modrinth) {
            sources.push({
                label: 'Modrinth',
                url: downloadLink.dataset.modrinth
            });
        }

        sources.push({
            label: 'GitHub',
            url: downloadLink.href
        });

        if (sources.length === 1) {
            return;
        }

        if (typeof dialog.showModal !== 'function') {
            return;
        }

        event.preventDefault();

        mcLabel.textContent = downloadLink.textContent.trim();
        options.replaceChildren();

        sources.forEach(function (source) {
            var item = document.createElement('li');
            var link = document.createElement('a');

            link.href = source.url;
            link.textContent = source.label;
            link.rel = 'noopener';

            if (source.label !== 'GitHub') {
                link.target = '_blank';
            }

            link.addEventListener('click', closeDialog);

            item.appendChild(link);
            options.appendChild(item);
        });

        dialog.showModal();
    });

    closeButton.addEventListener('click', closeDialog);

    dialog.addEventListener('click', function (event) {
        if (event.target === dialog) {
            closeDialog();
        }
    });
})();