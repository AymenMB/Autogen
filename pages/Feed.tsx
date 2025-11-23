import React from 'react';
import { PLACEHOLDER_CAR_1, PLACEHOLDER_CAR_2, getCarImageUrl } from '../constants';

const Feed: React.FC = () => {
  const posts = [
    {
      id: '1',
      user: 'autodreamer_77',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFEXMhBounU-Zr1YkLK_Pf0RKLcqv3e7AFeae_kORuLvWavuHzxnwMq7VaaA843ue__Kc-gh17fFMsdBOzt5j7A_Jj5qN_9LEHS0Uw4cCUJzCbv1xKtsh2YWcWGNZfuoaR_umzUbQsgm9bcpBO0VnB-JxqBA5vG3bsX_KbRrrxSvaKANo_YnfjYwIrd7S_7iib-X-RqoLPaCWzeBRvpiRt0pBjLFCDY8EoSlYBVMbq_wrMiaJJ6OBjwTszZVvOqfXw2RExmTlqjwY',
      image: getCarImageUrl('Hypercar Concept'),
      likes: '2,451',
      caption: 'The beast is finally home. Pure automotive art. #supercar #dreamcar'
    },
    {
      id: '2',
      user: 'carspotter_jane',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFB-ynoIqbnUot7Cbrf8KfJazGAJfAC4SuyS33sF4xjltRvdouf7hgsNJw418E46w8JbS2ryR-BETInSGTOD6nc0Cl9HwDjKKpqVEH88w-hr7GtA-oueqOsfcBlGpEcvHSXNBwLTPrIN5kAfB1kQxb5lzC5omsaiIgcBSj3gHDWciBSDjhuERGg0f-tU4Mg50I0YdK0kS1uW1jHKmIp6cY1sFu45AiaWcXZywxG5idiERklLs75V2790NFIg2ciTMyIAQ4lg0IdYw',
      image: getCarImageUrl('Classic Mercedes 300SL'),
      likes: '5,890',
      caption: 'Golden hour with a timeless classic. Can it get any better?'
    }
  ];

  return (
    <div className="flex flex-col gap-12">
      {posts.map((post) => (
        <article key={post.id} className="flex flex-col gap-4 bg-background-light dark:bg-background-dark rounded-xl overflow-hidden pb-4">
          <header className="flex items-center gap-4 px-4 pt-4">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10" style={{ backgroundImage: `url("${post.avatar}")` }} />
            <p className="text-white text-sm font-medium leading-normal flex-1 truncate">{post.user}</p>
            <button className="text-text-secondary-dark hover:text-white transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </header>
          <div className="w-full aspect-[1/1] bg-center bg-no-repeat bg-cover" style={{ backgroundImage: `url("${post.image}")` }} />
          <div className="px-4 flex gap-4">
            <button className="flex items-center justify-center text-white hover:text-primary transition-colors duration-200">
              <span className="material-symbols-outlined">favorite</span>
            </button>
            <button className="flex items-center justify-center text-white hover:text-primary transition-colors duration-200">
              <span className="material-symbols-outlined">chat_bubble</span>
            </button>
            <button className="flex items-center justify-center text-white hover:text-primary transition-colors duration-200">
              <span className="material-symbols-outlined">send</span>
            </button>
            <button className="flex items-center justify-center text-white hover:text-primary transition-colors duration-200 ml-auto">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
          <div className="px-4 flex flex-col gap-2">
            <p className="text-white text-sm font-semibold leading-normal">{post.likes} likes</p>
            <p className="text-white text-sm font-normal leading-normal"><span className="font-semibold">{post.user}</span> {post.caption}</p>
            <a className="text-text-secondary-dark text-sm font-normal leading-normal hover:text-white transition-colors" href="#">View all comments</a>
          </div>
        </article>
      ))}
    </div>
  );
};

export default Feed;