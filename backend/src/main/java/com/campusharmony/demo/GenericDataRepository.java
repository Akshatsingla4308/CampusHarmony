package com.campusharmony.demo;

import com.campusharmony.entity.BaseEntity;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Predicate;

/**
 * Demonstrates Core Java Generics Framework:
 * - Generic Interface & Generic Class with Type Parameters <T, ID>
 * - Bounded Type Parameter: <T extends BaseEntity>
 * - Generic Methods with independent type variables <R>
 * - Upper and lower bounded wildcards (<? extends T>, <? super T>)
 */
public class GenericDataRepository<T extends BaseEntity, ID> {

    private final Map<ID, T> storage = new ConcurrentHashMap<>();

    public T save(ID id, T entity) {
        if (id == null || entity == null) {
            throw new IllegalArgumentException("ID and entity must not be null");
        }
        storage.put(id, entity);
        return entity;
    }

    public Optional<T> findById(ID id) {
        return Optional.ofNullable(storage.get(id));
    }

    public List<T> findAll() {
        return new ArrayList<>(storage.values());
    }

    public boolean deleteById(ID id) {
        return storage.remove(id) != null;
    }

    public long count() {
        return storage.size();
    }

    /**
     * Generic Query Method using Functional Predicate.
     */
    public List<T> findByPredicate(Predicate<? super T> predicate) {
        List<T> matched = new ArrayList<>();
        for (T item : storage.values()) {
            if (predicate.test(item)) {
                matched.add(item);
            }
        }
        return matched;
    }

    /**
     * Generic Transformation Method mapping entity to another type R.
     */
    public <R> List<R> mapEntities(java.util.function.Function<? super T, ? extends R> mapper) {
        List<R> results = new ArrayList<>();
        for (T item : storage.values()) {
            results.add(mapper.apply(item));
        }
        return results;
    }

    /**
     * Batch save accepting any collection of subtypes (? extends T).
     */
    public void saveAll(Map<ID, ? extends T> batch) {
        if (batch != null) {
            storage.putAll(batch);
        }
    }
}
