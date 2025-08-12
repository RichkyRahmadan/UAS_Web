const burgerMenu = document.querySelector('.menuToggle input');
const nav = document.querySelector('header nav');

// event untuk memberi class/menghilangkan class bila diklik
burgerMenu.addEventListener('click',function(){
    nav.classList.toggle('slide');
})