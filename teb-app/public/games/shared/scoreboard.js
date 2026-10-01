// Shared by all the games. Tells the surrounding page (tebonsma.no/games/...) when a run
// starts and ends so it can record the score, and shows the scoreboard the page sends back
// in the game's #scoreboard element. Does nothing when the game is opened on its own.
(function () {
    const scoreboardElement = document.getElementById('scoreboard');

    function notifyPage(message) {
        if (window.parent !== window) {
            window.parent.postMessage(message, window.location.origin);
        }
    }

    function textElement(tag, text, className) {
        const element = document.createElement(tag);
        element.textContent = text;
        if (className) element.className = className;
        return element;
    }

    // Names come from members' profiles, so everything is inserted as text, never as HTML
    function render(message) {
        scoreboardElement.replaceChildren();
        scoreboardElement.classList.remove('hidden');

        if (message.state === 'saving') {
            scoreboardElement.append(textElement('p', 'Lagrer resultatet…', 'note'));
        } else if (message.state === 'error') {
            scoreboardElement.append(textElement('p', message.error, 'note'));
        } else if (message.state === 'login') {
            const loginButton = textElement('button', 'Logg inn', 'login');
            loginButton.addEventListener('click', () => notifyPage({ type: 'game:login' }));
            scoreboardElement.append(textElement('p', 'Logg inn for å komme på topplisten.', 'note'), loginButton);
        } else if (message.state === 'board') {
            const { top, you } = message.board;
            if (message.newBest) scoreboardElement.append(textElement('p', 'Ny rekord!', 'record'));
            scoreboardElement.append(textElement('h3', 'Toppliste'));
            if (top.length === 0) {
                scoreboardElement.append(textElement('p', 'Ingen resultater ennå.', 'note'));
            }
            const list = document.createElement('ol');
            top.forEach((entry, i) => {
                const row = document.createElement('li');
                if (entry.isYou) row.className = 'you';
                const who = document.createElement('span');
                who.className = 'who';
                who.append(
                    textElement('span', entry.name, 'name'),
                    textElement('span', new Date(entry.date).toLocaleDateString('nb-NO'), 'date'),
                );
                row.append(textElement('span', String(i + 1), 'rank'), who, textElement('span', String(entry.score), 'points'));
                list.append(row);
            });
            scoreboardElement.append(list);
            if (you && !top.some(entry => entry.isYou)) {
                scoreboardElement.append(textElement('p', `Din rekord: ${you.score} (nr. ${you.rank})`, 'note'));
            }
        }
    }

    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin || event.source !== window.parent) return;
        if (event.data && event.data.type === 'game:scoreboard') render(event.data);
    });

    window.Scoreboard = {
        runStarted() {
            notifyPage({ type: 'game:start' });
            scoreboardElement.classList.add('hidden');
            scoreboardElement.replaceChildren();
        },
        // silent: the run was abandoned (restarted) rather than lost, so there is no
        // game-over screen to show the scoreboard on
        runEnded(score, { silent = false } = {}) {
            notifyPage({ type: 'game:gameover', score, silent });
        },
    };
})();
