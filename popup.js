window.addEventListener('load', () => {
	const toggleComments = document.querySelector('#commentsHide');
	const radioButtons = Array.from(document.querySelectorAll('input[name="comments"]'));
	const radioBlocks = document.querySelector('.radio-blocks');

	chrome.storage.sync.get({
		hideComments: false,
		collapseInitialComments: false,
		collapseAllComments: true
	}, (data) => {
		if (data.hideComments) {
			!!toggleComments && (toggleComments.checked = true);
			radioBlocks.style.display = 'none';
		}
		if (data.collapseInitialComments) {
			const initialComments = document.querySelector('input[value="collapseInitialComments"]');
			!!initialComments && (initialComments.checked = true);
			return false;
		}
		if (data.collapseAllComments) {
			const allComments = document.querySelector('input[value="collapseAllComments"]');
			!!allComments && (allComments.checked = true);
			return false;
		}
	});

	!!toggleComments && toggleComments.addEventListener('change', (event) => {
		chrome.storage.sync.get(['hideComments', 'collapseInitialComments', 'collapseAllComments'], (data) => {
			chrome.storage.sync.set({
				...data,
				hideComments: event.target.checked
			});
		});

		sendMessage('Toggle comments');
		return false;
	});

	radioButtons.map((input) => {
		input.addEventListener('change', (event) => {
			chrome.storage.sync.get(['hideComments', 'collapseInitialComments', 'collapseAllComments'], (data) => {
				chrome.storage.sync.set({
					...data,
					collapseInitialComments: false,
					collapseAllComments: false,
					[event.target.value]: event.target.checked
				});
				sendMessage('Change radio');
			});
		});
	});

	const sendMessage = (data) => {
		chrome.tabs.query({url: ["https://dtf.ru/*", "https://tjournal.ru/*", "https://vc.ru/*"]}, (tabs) => {
			if (!!tabs.length) {
				tabs.map((tab) => {
					chrome.tabs.sendMessage(tab.id, data, () => {
						chrome.storage.sync.get(['hideComments'], (data) => {
							radioBlocks.style.display = data.hideComments ? 'none' : 'block';
						});
					});
				});
			}
		});
	}
});

