export const profile = {
  name: "Vansh Sharma",
  email: "vanshsharmagi288@gmail.com",
  linkedin: "https://www.linkedin.com/in/vansh58sharma/",
  github: "https://github.com/vanshsharma0058",
};

export const projects = [
  {
    number: "01",
    name: "Prompt2Site",
    category: "AI website builder · Full-stack product",
    description:
      "An AI website builder that turns natural-language prompts into generated websites. The product brings AI generation together with authentication, credits, payments, and a payment history workflow.",
    purpose: "Give a written idea a faster starting point by generating a website from a natural-language prompt.",
    contribution: "As a full-stack project developer, connected the React interface to a Node.js and Express backend, MongoDB data, LLM generation, and authenticated product workflows.",
    engineering: "Implemented a credit-based usage flow with Razorpay checkout, server-side payment signature verification, and a filterable payment history.",
    stack: ["React", "Node.js", "Express", "MongoDB", "LLM APIs", "Razorpay"],
    link: "https://prompt2site-1-cvux.onrender.com/",
    repo: "https://github.com/vanshsharma0058/Prompt2Site",
    visual: "prompt",
  },
  {
    number: "02",
    name: "DogStudio",
    category: "Interactive 3D · Creative development",
    description:
      "A visually driven web experience exploring browser-based 3D, shader effects, and scroll-led transitions with a React interface.",
    purpose: "Explore how an expressive creative-studio website can use browser-based 3D and scroll to shape its story.",
    contribution: "Built an interactive React experience combining a 3D scene, visual transitions, and scroll-led sections.",
    engineering: "Used React Three Fiber, Three.js, and Drei for scene work, GSAP and ScrollTrigger for choreography, and GLSL for shader effects.",
    stack: ["React Three Fiber", "Three.js", "Drei", "GSAP", "ScrollTrigger", "GLSL"],
    link: "https://dogstudio-3d-experience.vercel.app/",
    repo: "https://github.com/vanshsharma0058/dogstudio-3d-experience",
    visual: "dogstudio",
  },
  {
    number: "03",
    name: "Digital Signature App",
    category: "Document workflow · Web application",
    description:
      "A document-signing workflow built around document upload, an interactive signing step, server-side PDF processing, and signed-document download.",
    purpose: "Make document signing a connected browser-to-server workflow rather than a disconnected set of steps.",
    contribution: "Built a React interface and Node.js/Express workflow for document upload, interactive signing, PDF processing, and file download.",
    engineering: "The main implementation focus is coordinating precise user input in the interface with server-side document processing.",
    stack: ["React", "JavaScript", "Node.js", "Express", "PDF processing"],
    repo: "https://github.com/vanshsharma0058/Digital-Signature-App",
    visual: "signature",
  },
  {
    number: "04",
    name: "Employee Salary Predictor",
    category: "Applied machine learning · Supporting project",
    description:
      "A small web application that connects a linear-regression model to an input form, predicting salary from years of experience using a sample dataset.",
    purpose: "Turn years of experience into an estimated salary through a small, understandable prediction workflow.",
    contribution: "Connected a Flask input flow to a linear-regression model trained from a sample dataset.",
    engineering: "The project demonstrates the path from sample data and model fitting to a form-based prediction response.",
    stack: ["Python", "Flask", "scikit-learn", "pandas"],
    repo: "https://github.com/vanshsharma0058/Employee-salary-predictor",
    visual: "predictor",
  },
];

export const experience = [
  {
    period: "APR 2026 — PRESENT",
    role: "Full Stack Developer Intern",
    company: "Softiwa Technologies Pvt. Ltd.",
    details:
      "Contributing to a production School Management ERP, with work across responsive interfaces, reusable components, REST API workflows, authentication, and role-based experiences.",
    points: [
      "Integrated attendance, grade-management, and user-administration API workflows.",
      "Supported JWT authentication and role-based access for Admin, Teacher, and Student experiences.",
      "Resolved production UI issues and improved usability within a collaborative Git and Agile workflow.",
    ],
    note: "Technology details are intentionally omitted pending confirmation of the project stack.",
  },
  {
    period: "FEB 2026 — MAY 2026",
    role: "Web Development Intern",
    company: "Innovexis",
    details:
      "Built responsive React interfaces and supported API development and testing across frontend and backend workflows.",
    points: [
      "Developed responsive interfaces with React and Tailwind CSS.",
      "Built and consumed REST endpoints using Node.js and Express.",
      "Tested APIs with Postman and used Git feature branches for collaboration.",
    ],
  },
];

export const skillGroups = [
  { name: "Frontend", items: ["JavaScript ES6+", "TypeScript", "React", "Redux Toolkit", "React Router", "HTML5", "CSS3", "Tailwind CSS", "Responsive design"] },
  { name: "Backend", items: ["Node.js", "Express", "REST APIs", "JWT authentication", "Role-based access", "Middleware", "MVC", "Error handling"] },
  { name: "Databases", items: ["MongoDB", "Mongoose", "PostgreSQL", "MySQL", "SQL"] },
  { name: "AI & machine learning", items: ["LLM API integration", "Prompt engineering", "AI applications", "Python", "Flask", "scikit-learn", "Linear regression"] },
  { name: "Creative development", items: ["Three.js", "React Three Fiber", "Drei", "GSAP", "ScrollTrigger", "GLSL", "Interactive 3D"] },
  { name: "Tools & delivery", items: ["Git & GitHub", "Postman", "VS Code", "Firebase", "Vercel", "Render", "AWS", "Docker", "Jest"] },
];
