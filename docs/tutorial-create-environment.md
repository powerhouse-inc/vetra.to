# How to Create an Environment on Vetra Cloud

## 1. Log In

Go to [staging.vetra.io](https://staging.vetra.io) and log in with **Renown**. If your first login attempt doesn't work, try again — the second attempt should go through.

## 2. Navigate to Cloud

Click the **Cloud** link in the navigation bar.

## 3. Create a New Environment

Click **New Environment** and configure it to your needs.

> **Note:** Fusion is not yet supported.

Once you're happy with the configuration, **approve your changes**.

## 4. Watch the Deployment

After approving, you'll see the status change from **Approved** to **Deploying** shortly after. This means the processor has picked up your request and is now updating the cloud infrastructure.

## 5. Explore While You Wait

While the environment is being set up, check out the different tabs:

- **Metrics** — monitor resource usage
- **Logs** — follow what's happening under the hood
- **Deployments** — track deployment progress

You'll notice it first starts a container to **generate your SSL certificate**. Afterwards, it will start up your configured services like **Connect** and **Switchboard**.

## 6. Access Your Services

Once everything is healthy, click the **link next to the service toggle** to open Connect or Switchboard directly in the browser.
