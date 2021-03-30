window.addEventListener('load', () => {
	const toggleComments = document.querySelector('#commentsHide');
	const radioButtons = Array.from(document.querySelectorAll('input[name="comments"]'));

	chrome.storage.sync.get(['hideComments', 'collapseInitialComments', 'collapseAllComments'], (data) => {
		if (data.hideComments) {
			!!toggleComments && (toggleComments.checked = true);
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
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			chrome.tabs.sendMessage(tabs[0].id, data);
		});
	}
});

