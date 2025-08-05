import cron from "node-cron";
import fs from "fs";
import { exec } from "child_process";

function updateFile() {
  const date = new Date();
  const formattedDate = date.toISOString();
  fs.writeFile("date.txt", `Last run: ${formattedDate}\n`, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("File updated successfully");
      pushToGit(formattedDate);
    }
  });
}

function pushToGit(formattedDate) {
  const message = `Auto update on ${formattedDate}`;

  console.log("🔄 Starting Git operations...");
  
  exec("git add .", { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Git add error:", error.message);
      return;
    }
    if (stderr) console.warn("⚠️ Git add stderr:", stderr);
    console.log("✅ Git add successful");
    
    exec(`git commit -m "${message}"`, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes("nothing to commit")) {
          console.log("ℹ️ No changes to commit");
          return;
        }
        console.error("❌ Git commit error:", error.message);
        return;
      }
      if (stderr) console.warn("⚠️ Git commit stderr:", stderr);
      console.log("✅ Git commit successful:", stdout.trim());
      
      exec("git push origin main", { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Git push error:", error.message);
          console.error("Full error details:", error);
          return;
        }
        if (stderr) console.warn("⚠️ Git push stderr:", stderr);
        console.log("🚀 Git push complete!");
        console.log("Push output:", stdout);
      });
    });
  });
}

console.log("🚀 GitCron started - will update every day at 3:45 AM and 11:45 PM");

cron.schedule("45 3,23 * * *", () => {
  console.log("⏰ Running scheduled task...");
  updateFile();
});
