FROM debian:buster

# --- GENERAL DEPENDENCIES

    # general dependencies installation
    RUN apt-get update && apt-get install -y --no-install-recommends \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        nano


# --- CHROME -----------------------------------
        
    # Adding repo for chrome
    RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
        && echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

    # Chrome installation
    RUN apt-get update && apt-get install -y --no-install-recommends google-chrome-stable

    # Adds chrome user
    RUN groupadd -r chrome && useradd -r -g chrome -G audio,video chrome


# --- NODEJS -----------------------------------------

    # Adding repo for nodejs
    RUN curl -sSL https://deb.nodesource.com/setup_12.x | bash - 

    # nodejs installation
    RUN apt-get update && apt-get install -y --no-install-recommends nodejs


# --- LIGHTHOUSE ------------------------------------

    # lighthouse installation
    RUN npm install -g lighthouse


# --- LIGHTKEEPER -----------------------------------

    # Copy sources
    COPY app /lightkeeper
    RUN chmod +x /lightkeeper/lightkeeper

    # npm dependencies
    RUN cd /lightkeeper && npm install

    # Adds to path
    ENV PATH="/lightkeeper:${PATH}"


# --- CONTAINER --------------------------------------

    # Set current workdir
    WORKDIR /lightkeeper

    # default command
    CMD lightkeeper
