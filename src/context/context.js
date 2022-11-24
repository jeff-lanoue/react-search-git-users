import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

// Provider, Consumer -> GithubContext.Provider

const GithubProvider = ({ children }) => {
    const [githubUser, setGithubUser] = useState(mockUser);
    const [repos, setRepos] = useState(mockRepos);
    const [followers, setFollowers] = useState(mockFollowers);
    // request loading
    const [requests, setRequests] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    // error code here
    const [error, setError] = useState({ show: false, msg: "" });

    const searchGithubUser = async (user) => {
        toggleError();
        setIsLoading(true);
        const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
            console.log(err)
        );
        //console.log(response);
        if (response) {
            setGithubUser(response.data);
            const { login, followers_url } = response.data;
            /*             // repos
            axios(`${rootUrl}/users/${login}/repos?per_page=100`).then(
                (response) => setRepos(response.data)
            );
            // followers
            axios(`${followers_url}?per_page=100`).then((response) =>
                setFollowers(response.data)
            ); */
            await Promise.allSettled([
                axios(`${rootUrl}/users/${login}/repos?per_page=100`),
                axios(`${followers_url}?per_page=100`),
            ]).then((results) => {
                //console.log("Results from promise");
                const [repos, followers] = results;
                const status = "fulfilled";
                if (repos.status === status) {
                    setRepos(repos.value.data);
                }
                if (followers.status === status) {
                    setFollowers(followers.value.data);
                }
            });
            // more logic here
        } else {
            toggleError(true, "there is no user with that username.");
        }
        checkRequests();
        setIsLoading(false);
    };
    // check rate
    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                //console.log(data);
                let {
                    rate: { remaining },
                } = data;
                setRequests(remaining);

                if (remaining === 0) {
                    // throw an error
                    toggleError(
                        true,
                        "sorry you have exceeded your hourly limit !"
                    );
                }
            })
            .catch((err) => console.log(err));
    };
    // error ES6 feature, notice, if I define funciton with default parameters I don't need to call function with parameters as it will use the defauls in that case.
    function toggleError(show = true, msg = "") {
        setError({ show, msg });
    }

    useEffect(checkRequests, []);

    return (
        <GithubContext.Provider
            value={{
                githubUser,
                repos,
                followers,
                requests,
                error,
                searchGithubUser,
                isLoading,
            }}
        >
            {children}
        </GithubContext.Provider>
    );
};

export { GithubProvider, GithubContext };
