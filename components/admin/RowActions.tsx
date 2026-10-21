"use client";

import { deleteItem, moveItem, setPublished } from "@/app/admin/(panel)/list-actions";

type List = "products" | "projects" | "categories";

const mini = "btn btn-outline min-h-8 px-2.5 text-[13px]";

function Hidden({ list, id }: { list: List; id: string }) {
  return (
    <>
      <input type="hidden" name="list" value={list} />
      <input type="hidden" name="id" value={id} />
    </>
  );
}

export function MoveButtons({ list, id, label, first, last }: { list: List; id: string; label: string; first: boolean; last: boolean }) {
  return (
    <div className="flex gap-1">
      <form action={moveItem}>
        <Hidden list={list} id={id} />
        <input type="hidden" name="dir" value="up" />
        <button type="submit" disabled={first} className={mini} aria-label={`Move ${label} up`}>
          ↑
        </button>
      </form>
      <form action={moveItem}>
        <Hidden list={list} id={id} />
        <input type="hidden" name="dir" value="down" />
        <button type="submit" disabled={last} className={mini} aria-label={`Move ${label} down`}>
          ↓
        </button>
      </form>
    </div>
  );
}

export function PublishButton({ list, id, label, published }: { list: List; id: string; label: string; published: boolean }) {
  return (
    <form action={setPublished}>
      <Hidden list={list} id={id} />
      <input type="hidden" name="publish" value={String(!published)} />
      <button type="submit" className={mini} aria-label={`${published ? "Unpublish" : "Publish"} ${label}`}>
        {published ? "Unpublish" : "Publish"}
      </button>
    </form>
  );
}

export function DeleteButton({ list, id, label, className = "btn min-h-10 px-4 text-[14px] text-error" }: { list: List; id: string; label: string; className?: string }) {
  return (
    <form
      action={deleteItem}
      onSubmit={(e) => {
        if (!window.confirm(`Delete “${label}”? This can't be undone.`)) e.preventDefault();
      }}
    >
      <Hidden list={list} id={id} />
      <button type="submit" className={className}>
        Delete
      </button>
    </form>
  );
}

const LIST_ERRORS: Record<string, string> = {
  verify: "A project can only be published once “Photos verified” is ticked and it has a cover image. Open it to fix that first.",
  failed: "That change couldn't be saved. Refresh and try again.",
};

export function ListError({ code }: { code?: string }) {
  if (!code || !LIST_ERRORS[code]) return null;
  return (
    <p role="alert" className="mb-6 border border-error/40 bg-error/5 px-4 py-3 text-[14.5px] text-error">
      {LIST_ERRORS[code]}
    </p>
  );
}
