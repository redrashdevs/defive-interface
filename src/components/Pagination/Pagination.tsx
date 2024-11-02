import cx from "classnames";
import ReactPaginate from "react-paginate";
import Button from "components/Button/Button";

import "./Pagination.css";

type Props = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  topMargin?: boolean;
};


export default function Pagination({ page, pageCount, topMargin = true, onPageChange }: Props) {
  if (pageCount <= 1) {
    return <></>;
  }

  return (
    <div className="flex">
      <ReactPaginate
        breakLabel="..."
        nextLabel={<img src="/images/arrow-narrow-right.svg" />}
        onPageChange={(p) => onPageChange(p.selected + 1)}
        pageRangeDisplayed={1}
        marginPagesDisplayed={1}
        pageCount={pageCount}
        forcePage={page - 1}
        previousLabel={<img src="/images/arrow-narrow-left.svg" />}
        renderOnZeroPageCount={null}
        pageLinkClassName="w-full h-full flex items-center justify-center text-center"
        breakLinkClassName="w-full h-full flex items-center justify-center text-center"
        previousLinkClassName="w-full h-full flex items-center justify-center text-center"
        nextLinkClassName="w-full h-full flex items-center justify-center text-center"
        activeClassName={"bg-[#242429] text-white"}
        pageClassName="p-0 w-[48px] h-[40px] hover:bg-[#242429] flex items-center justify-center rounded-[4px] mx-4"
        previousClassName="flex items-center justify-center w-[48px] h-[40px] hover:bg-[#242429] rounded-[4px] p-0 mr-4"
        nextClassName="flex items-center justify-center w-[48px] h-[40px] hover:bg-[#242429] rounded-[4px] p-0 ml-4"
        containerClassName="px-8 h-[48px] bg-[#09090A] flex items-center h-full border-[1px] border-solid rounded-[8px] border-[#24242980]"
      />
    </div>
  );
}
