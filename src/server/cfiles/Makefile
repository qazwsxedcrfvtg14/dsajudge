CFLAGS += -std=c11 -O2 -Wall

.PHONY: all permission
all: zbox permission

permission: zbox
	sudo chown root zbox
	sudo chmod 4750 zbox

clean:
	$(RM) zbox
