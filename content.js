const linksToPagesWithComments = [
	'content-link',
	'content-feed__link',
	'widget_comment__content__text',
	'widget_comment__entry',
	'live__item__text',
	'profile_comment_favorite__title',
	'pddddbe2',
	'ijj670d0'
]

window.addEventListener('load', (event) => {
	checkPageOnCommentsBlock();

	window.addEventListener('click', (event) => {
		event.stopPropagation();

		if (linksToPagesWithComments.some((elem) => {
			return event.target.classList.contains(elem) || event.target.parentElement.classList.contains(elem);
		})) {
			setTimeout(() => {
				checkPageOnCommentsBlock();
			}, 3500);
		}
	});

	window.addEventListener('popstate', (event) => {
		setTimeout(() => {
			checkPageOnCommentsBlock();
		}, 3500);
	});
});

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
	sendResponse('Got message');
	checkPageOnCommentsBlock();
});

const checkPageOnCommentsBlock = () => {
	const commentsBlock = document.querySelector('.comments');

	if (!!commentsBlock) {
		chrome.storage.sync.get(['hideComments', 'collapseInitialComments', 'collapseAllComments'], (commentsOption) => {
			toggleCommentsBlock(commentsBlock, commentsOption);
		});

		if (!commentsBlock.classList.contains('make-votes')) {
			const comments = Array.from(commentsBlock.querySelectorAll('.comment'));
			if (comments.length > 0) {
				makeRealVotesBlock(comments);
				commentsBlock.classList.add('make-votes');
			}

			const observer = new MutationObserver(() => {
				const comments = Array.from(commentsBlock.querySelectorAll('.comment:not(.comment--vote)'));

				if (comments.length > 0) {
					makeRealVotesBlock(comments);
				}
			});
			observer.observe(commentsBlock.querySelector('.comments__content'), {childList: true});
		}
	}
}

const makeRealVotesBlock = (comments) => {
	comments.map(async (comment) => {
		await comment.querySelector('.vote__value').addEventListener('mouseenter', async (e) => {

			if (!e.target.classList.contains('got-real-vote')) {
				const likesDis = await getLikeDis(comment);
				await makeHTMLVotes(e.target, likesDis.like, likesDis.dis);

				const observer = new MutationObserver(async () => {
					if (e.target.childElementCount === 0) {
						const likesDis = await getLikeDis(comment);
						makeHTMLVotes(e.target, likesDis.like, likesDis.dis);
					}
				});
				observer.observe(e.target, {childList: true});

				comment.classList.add('.comment--vote');
			}

		});
	});
}

const getLikeDis = async (comment) => {
	const projectHostName = window.location.host;

	return await fetch(`https://${projectHostName}/vote/get_likers?id=${comment.dataset.id}&type=4&mode=raw`).
		then((response) => {
			if (response.ok) {
				return response.json();
			}
		}).
		then((response) => {
			return Object.values(response.data.likers).
				map((value) => {
					return value.sign;
				}).
				reduce((acc, val) => {
						const like = val === 1 ? (acc.like + 1) : acc.like;
						const dis = val === -1 ? (acc.dis + 1) : acc.dis;
						return { like, dis };
					},
					{like: 0, dis: 0}
				);
		}).catch((err) => console.log(err));
}

const makeHTMLVotes = (voteBlock, like, dis) => {
	const likeSpan = document.createElement('span');
	const disSpan = document.createElement('span');
	likeSpan.style.cssText = 'color: #2ea83a;';
	disSpan.style.cssText = 'color: #e52e3a';
	likeSpan.innerHTML = `${like} /&nbsp;`;
	disSpan.innerText = `${dis}`;

	voteBlock.innerText = '';
	voteBlock.append(likeSpan);
	voteBlock.append(disSpan);
	voteBlock.classList.add('got-real-vote');
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
		const commentsInitialArr = Array.from(commentsBlock.querySelectorAll("[data-reply_to='0']"));
		collapseComments(commentsBlock, commentsInitialArr, collapseElems);
	}
}

const collapseComments = (commentsBlock, comments, collapseOption) => {
	const scrollPositionBeforeCollapse = window.scrollY;

	Array.from(commentsBlock.querySelectorAll('.comment__expand-branch--visible')).map((openComments) => {
		openComments.click();
	});

	comments.map((comment) => {
		const id = comment.dataset.id;
		const firstReplyComment = commentsBlock.querySelector(`[data-reply_to="${id}"]`);

		if (!!firstReplyComment) {
			const firstReplyCommentBrunch = firstReplyComment.querySelector('.comment__branch');
			!!firstReplyCommentBrunch && firstReplyCommentBrunch.click();
		}
	});

	if ( collapseOption === 'all') {
		Array.from(commentsBlock.querySelectorAll('.comment__branch--no-border')).map((brunch) => brunch.click());
	}

	window.scrollTo(0, scrollPositionBeforeCollapse);
}
