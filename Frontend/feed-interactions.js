// feed-interactions.js
// Post, like, comment, ripple, and heart effects
import { getCurrentUser } from './feed-auth.js';

function spawnFloatingHeart(sourceBtn){
  const engagement = sourceBtn.closest('.engagement');
  if(!engagement) return;
  const heart = document.createElement('span');
  const variants = ['floating-heart','floating-heart alt1','floating-heart alt2'];
  heart.className = variants[Math.floor(Math.random()*variants.length)];
  const drift = (Math.random()*60 - 30).toFixed(0);
  const rot = (Math.random()*60 - 30).toFixed(0);
  heart.style.setProperty('--xOffset', drift + 'px');
  heart.style.setProperty('--rot', rot + 'deg');
  heart.textContent = '❤';
  heart.setAttribute('aria-hidden','true');
  engagement.appendChild(heart);
  heart.addEventListener('animationend', ()=> heart.remove());
}

function spawnFloatingHeartAt(post, x, y){
  const heart = document.createElement('span');
  const variants = ['floating-heart dbl','floating-heart dbl alt1','floating-heart dbl alt2'];
  heart.className = variants[Math.floor(Math.random()*variants.length)];
  const drift = (Math.random()*40 - 20).toFixed(0);
  const rot = (Math.random()*50 - 25).toFixed(0);
  heart.style.left = (x - post.getBoundingClientRect().left - 20) + 'px';
  heart.style.top = (y - post.getBoundingClientRect().top - 20) + 'px';
  heart.style.setProperty('--xOffset', drift + 'px');
  heart.style.setProperty('--rot', rot + 'deg');
  heart.textContent = '❤';
  heart.setAttribute('aria-hidden','true');
  post.appendChild(heart);
  heart.addEventListener('animationend', ()=> heart.remove());
}

export function setupInteractions(){
  document.addEventListener('click', e => {
    const likeBtn = e.target.closest('.like-toggle');
    if(likeBtn){
      const icon = likeBtn.querySelector('i');
      const countEl = likeBtn.parentElement.querySelector('.like-count');
      const liked = likeBtn.classList.toggle('liked');
      likeBtn.setAttribute('aria-pressed', String(liked));
      if(icon){
        icon.classList.toggle('far', !liked);
        icon.classList.toggle('fas', liked);
      }
      const current = parseInt(countEl.textContent)||0;
      countEl.textContent = liked ? current + 1 : Math.max(0, current -1);
      if(liked) spawnFloatingHeart(likeBtn);
    }

    const miniLike = e.target.closest('.mini-like');
    if(miniLike){
      const icon = miniLike.querySelector('i');
      const countSpan = miniLike.querySelector('.mini-like-count');
      const liked = miniLike.classList.toggle('liked');
      miniLike.setAttribute('aria-pressed', String(liked));
      if(icon){
        icon.classList.toggle('far', !liked);
        icon.classList.toggle('fas', liked);
      }
      const current = parseInt(countSpan.textContent)||0;
      countSpan.textContent = liked ? current + 1 : Math.max(0, current -1);
    }
  });

  // Comment input enable/disable
  document.addEventListener('input', e => {
    if(e.target.classList.contains('comment-input')){
      const wrapper = e.target.closest('.comment-box');
      const sendBtn = wrapper.querySelector('.send-comment');
      sendBtn.disabled = e.target.value.trim().length === 0;
    }
  });

  document.addEventListener('keydown', e => {
    if(e.target.classList.contains('comment-input') && e.key === 'Enter'){
      e.preventDefault();
      submitComment(e.target);
    }
  });

  document.addEventListener('click', e => {
    if(e.target.classList.contains('send-comment')){
      const box = e.target.closest('.comment-box');
      const input = box.querySelector('.comment-input');
      submitComment(input);
    }
  });

  // Double click like on images
  document.addEventListener('dblclick', e => {
    const img = e.target.closest('.post-image img, .post-image');
    if(!img) return;
    const post = e.target.closest('.post');
    if(!post) return;
    const likeBtn = post.querySelector('.like-toggle');
    if(likeBtn && !likeBtn.classList.contains('liked')) likeBtn.click();
    spawnFloatingHeartAt(post, e.clientX, e.clientY);
  });

  // Follow buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('.follow-btn');
    if(!btn) return;
    const isFollowing = btn.classList.toggle('following');
    btn.setAttribute('aria-pressed', String(isFollowing));
    btn.textContent = isFollowing ? 'Following' : 'Follow';
  });

  // Post creation
  const postInput = document.querySelector('.post-input input');
  const postBtn = document.querySelector('.post-btn');
  if(postBtn){
    postBtn.addEventListener('click', ()=> {
      const content = postInput.value.trim();
      if(content){ createNewPost(content); postInput.value=''; }
    });
  }
  if(postInput){
    postInput.addEventListener('keypress', e => {
      if(e.key === 'Enter'){
        const content = postInput.value.trim();
        if(content){ createNewPost(content); postInput.value=''; }
      }
    });
  }
}

function submitComment(input){
  const text = input.value.trim();
  if(!text) return;
  const engagement = input.closest('.post').querySelector('.engagement');
  const commentCount = engagement.querySelector('.comment-count');
  const current = parseInt(commentCount.textContent)||0;
  commentCount.textContent = current + 1;
  const list = input.closest('.post-interactions').querySelector('.comments-list');
  if(list){
    const li = document.createElement('li');
    li.className = 'comment-item';
    li.innerHTML = `<div class="comment-body"><span class="comment-author">You</span><span class="comment-text"></span></div><button class="mini-like" type="button" aria-pressed="false" title="Like comment"><i class="far fa-heart" aria-hidden="true"></i><span class="mini-like-count">0</span></button>`;
    li.querySelector('.comment-text').textContent = text;
    list.appendChild(li);
  }
  input.value='';
  const sendBtn = input.closest('.comment-box').querySelector('.send-comment');
  sendBtn.disabled = true;
}

function createNewPost(content){
  const currentUser = getCurrentUser();
  const postsContainer = document.querySelector('.posts');
  if(!postsContainer) return;
  const newPost = document.createElement('div');
  newPost.className = 'post';
  newPost.innerHTML = `<div class="post-header"><div class="post-author"><img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face" alt="You"><div class="author-info"><div class="author-top"><h4>${currentUser ? currentUser.username : 'You'}</h4></div><p>Student</p></div></div><button class="more-options" aria-label="Post options"><i class="fas fa-ellipsis-h"></i></button></div><div class="post-content"><p>${content}</p></div><div class="post-interactions"><div class="engagement"><button class="icon-btn like-toggle" type="button" aria-pressed="false" title="Like"><i class="far fa-heart" aria-hidden="true"></i></button><span class="like-count" aria-label="0 likes">0</span><button class="icon-btn comment-toggle" type="button" title="Comments"><i class="far fa-comment" aria-hidden="true"></i></button><span class="comment-count" aria-label="0 comments">0</span><button class="icon-btn share-toggle" type="button" title="Share"><i class="far fa-share-square" aria-hidden="true"></i></button><span class="share-count" aria-label="0 shares">0</span></div><div class="comment-box" aria-label="Add a comment"><input type="text" placeholder="Add a comment..." class="comment-input" /><button class="send-comment" type="button" disabled>Post</button></div><ul class="comments-list"><li class="comment-item"><div class="comment-body"><span class="comment-author">CampusBot</span><span class="comment-text">Welcome to your new post! 🎉</span></div><button class="mini-like" type="button" aria-pressed="false" title="Like comment"><i class="far fa-heart" aria-hidden="true"></i><span class="mini-like-count">0</span></button></li></ul></div>`;
  postsContainer.insertBefore(newPost, postsContainer.firstChild);
}
