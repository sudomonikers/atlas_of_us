import { NavBar } from "../../common-components/navbar/nav";
import { useEffect, useRef, useState } from "react";
import './blog.css';

interface Blog {
  id: string;
  title: string;
  date: string;
  content: string;
}

// Sample blog data - replace with your actual data source
const sampleBlogs: Blog[] = [
  {
    id: "blog-1",
    title: "Getting Started with React",
    date: "April 10, 2025",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl."
  },
  {
    id: "blog-2",
    title: "Advanced TypeScript Tips",
    date: "April 8, 2025",
    content: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra."
  },
  {
    id: "blog-3",
    title: "CSS Grid Layout Mastery",
    date: "April 5, 2025",
    content: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."
  },
  {
    id: "blog-4",
    title: "Getting Started with React",
    date: "April 10, 2025",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl."
  },
  {
    id: "blog-5",
    title: "Advanced TypeScript Tips",
    date: "April 8, 2025",
    content: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra."
  },
  {
    id: "blog-6",
    title: "CSS Grid Layout Mastery",
    date: "April 5, 2025",
    content: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."
  },
  {
    id: "blog-7",
    title: "Getting Started with React",
    date: "April 10, 2025",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies aliquam, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl."
  },
  {
    id: "blog-8",
    title: "Advanced TypeScript Tips",
    date: "April 8, 2025",
    content: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra."
  },
  {
    id: "blog-9",
    title: "CSS Grid Layout Mastery",
    date: "April 5, 2025",
    content: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."
  }
];

export function Blog() {
  const [blogs, setBlogs] = useState<Blog[]>(sampleBlogs);
  const [activeId, setActiveId] = useState<string>(sampleBlogs[0].id);
  const observerRefs = useRef<IntersectionObserver[]>([]);

  const scrollToBlog = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
    }
  };

  useEffect(() => {
    observerRefs.current.forEach(observer => observer.disconnect());
    observerRefs.current = [];
    
    blogs.forEach(blog => {
      const element = document.getElementById(blog.id);
      if (!element) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.boundingClientRect.top <= window.innerHeight / 2) {
              setActiveId(blog.id);
            }
          });
        },
        {
          threshold: 0,
          rootMargin: `-50% 0px -50% 0px`
        }
      );
      
      observer.observe(element);
      observerRefs.current.push(observer);
    });
    
    return () => {
      observerRefs.current.forEach(observer => observer.disconnect());
    };
  }, [blogs]);

  return (
    <>
      <NavBar/>
      <div className="in-nav-container dark-background">
        <h1 className="blog-big-h1">BLOG</h1>
        <div className="blog-container">
          <div className="blogs">
            {blogs.map(blog => (
              <div key={blog.id} id={blog.id} className="blog-post">
                <h2 className="blog-title">{blog.title}</h2>
                <p className="blog-date">{blog.date}</p>
                <div className="blog-content">
                  {blog.content}
                </div>
              </div>
            ))}
          </div>
          <div className="blog-navigator">
            <div className="toc-container">
              <h3 className="toc-heading">Table of Contents</h3>
              <ul className="toc-list">
                {blogs.map(blog => (
                  <li 
                    key={blog.id} 
                    className={`toc-item ${activeId === blog.id ? 'active' : ''}`}
                    onClick={() => scrollToBlog(blog.id)}
                  >
                    {blog.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}