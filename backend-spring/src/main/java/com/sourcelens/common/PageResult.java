package com.sourcelens.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 分页响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {

    private List<T> items;
    private int page;
    private int pageSize;
    private long total;

    public static <T> PageResult<T> of(List<T> items, int page, int pageSize, long total) {
        return new PageResult<>(items, page, pageSize, total);
    }
}