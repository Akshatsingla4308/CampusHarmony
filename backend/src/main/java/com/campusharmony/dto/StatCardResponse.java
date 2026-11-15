package com.campusharmony.dto;

public class StatCardResponse {

    private String key;
    private String label;
    private Object value;
    private String delta;
    private String icon;

    public StatCardResponse() {
    }

    public StatCardResponse(String key, String label, Object value, String delta, String icon) {
        this.key = key;
        this.label = label;
        this.value = value;
        this.delta = delta;
        this.icon = icon;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public String getDelta() {
        return delta;
    }

    public void setDelta(String delta) {
        this.delta = delta;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }
}
