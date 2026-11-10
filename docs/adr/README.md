# Architecture decision records

Decisions that are hard to undo and affect more of the app than the feature that introduced them. Read the relevant ones before changing the data model or the structure of the app. Add a new one as `NNNN-short-name.md` and list it here.

| #                                         | Title                            | Status   | Summary                                                                                                                                                      |
| ----------------------------------------- | -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [0001](0001-quack-deletion-tombstones.md) | Deleted quacks become tombstones | Accepted | Deleting a quack wipes its content and poll but keeps the row with `deletedAt`, so replies keep their parent and every quack query must filter deleted ones. |
