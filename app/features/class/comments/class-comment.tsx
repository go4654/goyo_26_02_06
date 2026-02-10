import { ArrowUpDown } from "lucide-react";

import { Badge } from "~/core/components/ui/badge";

import { COMMENT_MOCKUP } from "../constants/comment.mockup";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

export default function ClassComment() {
  return (
    <>
      {/* 댓글 */}
      <div className="mt-26">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="xl:text-h6">댓글</h2>
            <Badge className="mt-1">{COMMENT_MOCKUP.length}</Badge>
          </div>

          <div className="text-text-3 flex cursor-pointer items-center gap-2 text-base">
            <span>최신순</span> <ArrowUpDown className="size-4" />
          </div>
        </div>

        {/* 댓글 작성 폼 */}
        <CommentForm />

        {/* 댓글 목록 */}
        <CommentList />
      </div>
    </>
  );
}
