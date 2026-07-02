import cron from "node-cron";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const GIT_USER_NAME = process.env.GIT_USER_NAME || "duk-meow";
const GIT_USER_EMAIL = process.env.GIT_USER_EMAIL || "insanetomm@gmail.com";
const BRANCH = process.env.GIT_BRANCH || "main";

// Logger to handle sensitive information appropriately
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, error) => {
    console.error(`[ERROR] ${message}`);
    // In a real production app, we would log the full error object to a secure,
    // centralized logging system here. For this exercise, we keep it off console.
  },
};

function updateFile() {
  const date = new Date();
  const formattedDate = date.toISOString();
  fs.writeFile("date.txt", `Last run: ${formattedDate}\n`, (err) => {
    if (err) {
      logger.error("Failed to update file.", err);
    } else {
      logger.info("File updated successfully.");
      pushToGit(formattedDate);
    }
  });
}

async function pushToGit(formattedDate) {
  const message = `chore: automated update - ${formattedDate}`;
  logger.info("Starting Git operations...");

  try {
    // Configure git identity
    await execPromise(
      `git config user.name "${GIT_USER_NAME}" && git config user.email "${GIT_USER_EMAIL}"`
    );
    logger.info("Git identity configured.");

    // Git add
    await execPromise("git add .");
    logger.info("Git add successful.");

    // Git commit
    try {
      const { stdout: commitOutput } = await execPromise(
        `git commit -m "${message}"`
      );
      logger.info("Git commit successful.");
    } catch (commitError) {
      if (
        commitError.message.includes("nothing to commit") ||
        commitError.stderr?.includes("nothing to commit")
      ) {
        logger.info("No changes to commit.");
        return;
      }
      throw commitError;
    }

    // Pull with rebase before pushing to avoid conflicts
    try {
      await execPromise(`git pull --rebase origin ${BRANCH}`);
      logger.info("Git pull successful.");
    } catch (pullError) {
      logger.info("Pull not needed or already up to date.");
    }

    // Git push
    await execPromise(`git push origin ${BRANCH}`);
    logger.info("Git push complete!");

  } catch (error) {
    logger.error("Git operation failed. Internal Server Error.", error);
  }
}

// Configure git identity on startup
async function initializeGit() {
  try {
    await execPromise(
      `git config user.name "${GIT_USER_NAME}" && git config user.email "${GIT_USER_EMAIL}"`
    );
    logger.info("Git identity initialized.");
  } catch (error) {
    logger.error("Failed to initialize git.", error);
  }
}

// Initialize git config when server starts
await initializeGit();

// Schedule the cron job
logger.info("GitCron started - Running every minute");
logger.info(`Commits will be made by: ${GIT_USER_NAME} <${GIT_USER_EMAIL}>`);

cron.schedule("* * * * *", () => {
  logger.info("Running scheduled task...");
  updateFile();
});