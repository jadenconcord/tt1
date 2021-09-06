let globalStorage = {
    async getItem(name, url = "https://gossamer-second-galleon.glitch.me") {
        let res = await fetch(url + "/get/" + name, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
        let json = await res.json();
        return json;
    },
    async setItem(name, data, url = "https://gossamer-second-galleon.glitch.me") {
        let res = await fetch(url + "/set/" + name, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        let json = await res.json();
        return json;
    },
};