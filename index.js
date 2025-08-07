import cron from "node-cron";
import fs from "fs";
import { exec } from "child_process";

function updateFile() {
  const date = new Date();
  const formattedDate = date.toISOString();

  fs.writeFile("date.txt", `Last run: ${formattedDate}\n`, (err) => {
    if (err) {
      console.error("❌ Error writing to file:", err);
    } else {
      console.log("📄 File updated successfully");
      pushToGit(formattedDate);
    }
  });
}

function pushToGit(formattedDate) {
  const message = `Auto update on ${formattedDate}`;
  console.log("🔄 Starting Git operations...");

  // Set Git config first
  exec(
    'git config user.email "auto-bot@example.com" && git config user.name "Auto Bot"',
    { cwd: process.cwd() },
    (err) => {
      if (err) {
        console.error("❌ Failed to set Git config:", err.message);
        return;
      }

      // Then run git add
      exec("git add .", { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Git add error:", error.message);
          return;
        }
        if (stderr) console.warn("⚠️ Git add stderr:", stderr);
        console.log("✅ Git add successful");

        // Commit
        exec(
          `git commit -m "${message}"`,
          { cwd: process.cwd() },
          (error, stdout, stderr) => {
            if (error) {
              if (
                error.message.includes("nothing to commit") ||
                stderr.includes("nothing to commit")
              ) {
                console.log("ℹ️ No changes to commit");
                return;
              }
              console.error("❌ Git commit error:", error.message);
              return;
            }
            if (stderr) console.warn("⚠️ Git commit stderr:", stderr);
            console.log("✅ Git commit successful:", stdout.trim());

            // Push
            exec(
              "git push origin main",
              { cwd: process.cwd() },
              (error, stdout, stderr) => {
                if (error) {
                  console.error("❌ Git push error:", error.message);
                  return;
                }
                if (stderr) console.warn("⚠️ Git push stderr:", stderr);
                console.log("🚀 Git push complete!");
                console.log("Push output:", stdout);
              }
            );
          }
        );
      });
    }
  );
}

// Update every day at 3:51 AM and 11:51 PM
console.log("🚀 GitCron started - will update every day at 3:51 AM and 11:51 PM");

cron.schedule("* * * * *", () => {
  console.log("⏰ Running scheduled task...");
  updateFile();
});
