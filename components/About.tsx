import React from "react";
import Skills from "./Skills";

function About() {
  const milliseconds: number =
    new Date().getTime() - new Date("01/13/2003").getTime();

  const age = Math.floor(milliseconds / 1000 / 60 / 60 / 24 / 365);

  return (
    <section id="about" className="w-full min-h-screen flex items-center">
      {/* about & skills display */}

      {/* large is gonna have about | skills */}
      <div className="about-skills w-full flex lg:flex-row flex-col lg:justify-between justify-center lg:pt-0 pt-12">
        <div className="about flex-1 lg:mb-0 mb-12 lg:mr-8 mr-0 lg:w-1/2 w-1/1">
          <h2 className="lg:mb-16 mb-8 font-bold lg:text-5xl text-3xl underline underline-offset-8 text-left">
            about
          </h2>
          <p className="lg:mb-12 md:mb-8 mb-4 lg:text-xl md:text-lg text-base font-light">
            {" "}
            I am a {age}-year-old programmer in my university year in Sunan Gunung Djati with a passion for fullstack web especially backend. I enjoy
            building meaningful products that can express my creativity through
            code.{" "}
          </p>
        </div>
        <div className="skills flex-1 lg:ml-8 ml-0 lg:w-1/2 w-1/1">
          <h2 className="lg:mb-16 mb-8 font-bold lg:text-5xl text-3xl underline underline-offset-8 text-left">
            skills
          </h2>
          <Skills />
        </div>
      </div>
    </section>
  );
}

export default About;
