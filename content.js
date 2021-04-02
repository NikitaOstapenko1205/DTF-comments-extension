const linksToPagesWithComments = [
	'content-feed__link',
	'widget_comment__content__text',
	'widget_comment__entry',
	'live__item__text',
	'u-notification__link',
]

// const elemsDisabledForClicks = ['comments__item__collapse_subtree', 'comments__item__expand'];

window.addEventListener('load', (event) => checkPageOnCommentsBlock());

window.addEventListener('click', (event) => {
	event.stopPropagation();

	if (linksToPagesWithComments.some((elem) => event.target.classList.contains(elem))) {
		setTimeout(() => {
			checkPageOnCommentsBlock();
		}, 3000);
	}
});

window.addEventListener('popstate', (event) => {
	setTimeout(() => {
		checkPageOnCommentsBlock();
	}, 3000);
});

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
	sendResponse('Got message');
	checkPageOnCommentsBlock();
});

const checkPageOnCommentsBlock = () => {
	const commentsBlock = document.querySelector('.comments');

	if (commentsBlock) {
		chrome.storage.sync.get(['hideComments', 'collapseInitialComments', 'collapseAllComments'], (commentsOption) => {
			toggleCommentsBlock(commentsBlock, commentsOption);
		});
	}
}

const toggleBlockWithCat = (commentsBlock, isHideComments) => {
	const catBlock = commentsBlock.parentElement.querySelector('.cat-block');

	if (isHideComments && !catBlock) {
		fetch('https://api.thecatapi.com/v1/images/search').
		then((response) => {
			if (response.ok) {
				return response.json();
			}
		}).
		then((catApiResponse) => {
			createBlockWithCat(commentsBlock, catApiResponse);
		}).
		catch((err) => console.log(err));
	} else {
		!!catBlock && (catBlock.style.display = isHideComments ? 'block' : 'none');
	}
}

const createBlockWithCat = (commentsBlock, catApiResponse) => {
	const catBlockDiv = document.createElement('div');
	catBlockDiv.style.cssText = 'margin: 0 20px; text-align: center;';
	catBlockDiv.classList.add('cat-block');

	const catImg = document.createElement('img');
	catImg.style.cssText = 'display: block; max-width: 400px; max-height: 350px; margin: 25px auto 0;';
	catImg.setAttribute('src', String(catApiResponse[0].url));

	catBlockDiv.innerHTML = `
			<h3 class="content-title content-title--short">Лучше смотреть на котиков, чем в комментарии ^-^</h3>
		`;
	catBlockDiv.append(catImg);
	commentsBlock.parentElement.prepend(catBlockDiv);
}

const toggleCommentsBlock = (commentsBlock, commentsOption) => {
	commentsBlock.style.display = commentsOption.hideComments ? 'none' : 'block';
	toggleBlockWithCat(commentsBlock, commentsOption.hideComments);

	if (!commentsOption.hideComments) {
		const collapseElems = commentsOption.collapseAllComments ? 'all' : 'initial';
		collapseComments(commentsBlock, collapseElems);
	}
}

const collapseComments = (commentsBlock, collapseElems) => {
	const commentsInitialArr = Array.from(commentsBlock.querySelector('.comments__content').children);
	const commentsInternalArr = commentsInitialArr && commentsInitialArr.reduce(
		(acc, initialComment) => {
			return [...acc, ...Array.from(initialComment.querySelectorAll('.comments__item'))];
		}, []);

	collapseSingleComment([...commentsInitialArr, ...commentsInternalArr], 'close');

	if (collapseElems === 'initial') {
		collapseSingleComment(commentsInternalArr, 'open');
	}
}

const collapseSingleComment = (comments, collapseOption) => {
	comments.map((comment) => {
		const commentChildren = comment.querySelector('.comments__item__children');
		let needClick = false;

		if (
			collapseOption === 'open' ||
			(collapseOption === 'close' && !comment.classList.contains('comments__item--collapsed'))
		) {
			needClick = true;
		}

		if (commentChildren.childElementCount > 0 && needClick) {
			let collapseChildrenElem;

			if (collapseOption === 'close') {
				collapseChildrenElem = commentChildren.nextElementSibling;
			} else if (commentChildren.parentElement.querySelector('.comments__item__expand')) {
				collapseChildrenElem = commentChildren.nextElementSibling.nextElementSibling;
			}

			const scrollPositionBeforeCollapse = window.scrollY;
			!!collapseChildrenElem && collapseChildrenElem.click();
			window.scrollTo(0, scrollPositionBeforeCollapse);
		}
	});
}
