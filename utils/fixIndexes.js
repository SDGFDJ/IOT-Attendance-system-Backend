import UserModel from "../models/user.model.js";

export const fixUserIndexes = async () => {
  try {
    console.log("🛠 Checking & Fixing User Indexes...");

    const indexes = await UserModel.collection.getIndexes();

    if (indexes.email_1) {
      await UserModel.collection.dropIndex("email_1");
      console.log("✔ Dropped old unique index: email_1");
    }

    if (indexes.studentId_1) {
      // keep studentId unique but safe
      console.log("✔ StudentId unique index exists OK");
    }

  } catch (error) {
    console.log("⚠ Index Fix Error:", error.message);
  }
};
